import { createError } from 'h3'

interface ResolveVanityResponse {
  response?: { steamid?: string, success?: number }
}

interface PlayerSummary {
  steamid: string
  personaname: string
  profileurl: string
  avatarfull: string
}

interface PlayerSummariesResponse {
  response?: { players?: PlayerSummary[] }
}

export interface SteamOwnedGame {
  appid: number
  name?: string
  /** Minutes played in total. Zero for every game when the owner hides playtime. */
  playtime_forever?: number
  /** Minutes played in the last two weeks. */
  playtime_2weeks?: number
  /** Unix timestamp of the last session. */
  rtime_last_played?: number
}

interface OwnedGamesResponse {
  response?: { game_count?: number, games?: SteamOwnedGame[] }
}

export interface SteamProfile {
  steamId: string
  name: string
  avatarUrl: string
  profileUrl: string
}

export interface SteamLibrary {
  steamId: string
  gameCount: number
  games: SteamOwnedGame[]
}

interface RawStoreItem {
  appid?: number
  success?: number
  name?: string
  /** 0 is a game; applications, tools, DLC and soundtracks use other values. */
  type?: number
  is_free?: boolean
  tags?: Array<{ tagid: number, weight?: number }>
  categories?: { supported_player_categoryids?: number[], feature_categoryids?: number[] }
  reviews?: { summary_filtered?: { review_count?: number, percent_positive?: number } }
  release?: { steam_release_date?: number, is_coming_soon?: boolean, is_early_access?: boolean }
  platforms?: { windows?: boolean, mac?: boolean, steamos_linux?: boolean }
  assets?: { asset_url_format?: string, header?: string }
}

interface StoreItemsResponse {
  response?: { store_items?: RawStoreItem[] }
}

interface TagListResponse {
  response?: { tags?: Array<{ tagid: number, name: string }> }
}

export interface StoreItem {
  appId: number
  name: string
  isGame: boolean
  imageUrl: string
  /** Tag names, most voted first. */
  tags: string[]
  categoryIds: number[]
  platforms: string[]
  free: boolean
  comingSoon: boolean
  releaseDate?: string
  reviewCount: number
  /** Share of positive reviews, 0–100. */
  reviewPercent?: number
}

export interface SimilarApps {
  /** Steam's "similar released items", ordered by relevance. */
  relevant: number[]
  /** Steam's "top sellers" among similar items: less specific, but better known. */
  popular: number[]
}

const STEAM_API_BASE = 'https://api.steampowered.com'
const SIMILAR_API_BASE = 'https://store.steampowered.com/recommended/morelike/app'
const ASSET_BASE = 'https://shared.cloudflare.steamstatic.com/store_item_assets/'
const STEAM_ID_PATTERN = /^7656119\d{10}$/
const STORE_CACHE_TTL = 12 * 60 * 60 * 1000
// Failed requests (timeouts, rate limits) are retried soon instead of hiding a game for half a day.
const FAILURE_CACHE_TTL = 5 * 60 * 1000
const STORE_ITEMS_BATCH = 50
const storeCache = new Map<number, { expiresAt: number, value: StoreItem | null }>()
const similarCache = new Map<number, { expiresAt: number, value: SimilarApps }>()
let tagNames: { expiresAt: number, value: Map<number, string> } | undefined

function parseProfileInput(input: string): { steamId?: string, vanity?: string } {
  const trimmed = input.trim()

  if (STEAM_ID_PATTERN.test(trimmed)) return { steamId: trimmed }

  const value = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    const segments = url.pathname.split('/').filter(Boolean)

    if (host === 'steamcommunity.com' && segments[0] === 'profiles' && STEAM_ID_PATTERN.test(segments[1] || '')) {
      return { steamId: segments[1] }
    }

    if (host === 'steamcommunity.com' && segments[0] === 'id' && segments[1]) {
      return { vanity: segments[1] }
    }
  } catch {
    // A plain vanity name is handled below.
  }

  if (/^[\w-]{2,64}$/.test(trimmed)) return { vanity: trimmed }

  throw createError({
    statusCode: 400,
    statusMessage: `“${trimmed}” is not a valid Steam profile URL, SteamID64, or vanity name.`
  })
}

async function steamApiFetch<T>(path: string, apiKey: string, query: Record<string, string | number | boolean>) {
  try {
    return await $fetch<T>(`${STEAM_API_BASE}${path}`, {
      query,
      headers: { 'x-webapi-key': apiKey },
      retry: 1,
      timeout: 12_000
    })
  } catch (error) {
    console.error(`Steam Web API request failed for ${path}`, error)
    throw createError({ statusCode: 502, statusMessage: 'Steam could not be reached. Please try again in a moment.' })
  }
}

async function resolveVanity(vanity: string, apiKey: string) {
  const result = await steamApiFetch<ResolveVanityResponse>('/ISteamUser/ResolveVanityURL/v1/', apiKey, { vanityurl: vanity })
  const steamId = result.response?.steamid

  if (!steamId || result.response?.success !== 1) {
    throw createError({ statusCode: 404, statusMessage: `No Steam profile could be found for “${vanity}”.` })
  }

  return steamId
}

export async function resolveSteamIds(inputs: string[], apiKey: string) {
  const ids = await Promise.all(inputs.map(async (input) => {
    const parsed = parseProfileInput(input)
    return parsed.steamId || resolveVanity(parsed.vanity!, apiKey)
  }))

  if (new Set(ids).size !== ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'Each Steam profile must belong to a different player.' })
  }

  return ids
}

export async function getSteamProfiles(steamIds: string[], apiKey: string): Promise<SteamProfile[]> {
  const result = await steamApiFetch<PlayerSummariesResponse>('/ISteamUser/GetPlayerSummaries/v2/', apiKey, {
    steamids: steamIds.join(',')
  })
  const players = result.response?.players || []
  const byId = new Map(players.map(player => [player.steamid, player]))

  return steamIds.map((steamId) => {
    const player = byId.get(steamId)
    if (!player) {
      throw createError({ statusCode: 404, statusMessage: `Steam profile ${steamId} could not be loaded.` })
    }

    return {
      steamId,
      name: player.personaname,
      avatarUrl: player.avatarfull,
      profileUrl: player.profileurl
    }
  })
}

export async function getSteamLibraries(steamIds: string[], apiKey: string): Promise<SteamLibrary[]> {
  return await Promise.all(steamIds.map(async (steamId) => {
    const result = await steamApiFetch<OwnedGamesResponse>('/IPlayerService/GetOwnedGames/v1/', apiKey, {
      steamid: steamId,
      include_appinfo: true,
      include_played_free_games: true
    })
    const games = result.response?.games || []
    return { steamId, gameCount: result.response?.game_count || games.length, games }
  }))
}

async function getTagNames(apiKey: string) {
  if (tagNames && tagNames.expiresAt > Date.now()) return tagNames.value

  const result = await steamApiFetch<TagListResponse>('/IStoreService/GetTagList/v1/', apiKey, { language: 'english' })
  const value = new Map((result.response?.tags || []).map(tag => [tag.tagid, tag.name]))
  tagNames = { expiresAt: Date.now() + STORE_CACHE_TTL, value }
  return value
}

function toStoreItem(raw: RawStoreItem, names: Map<number, string>): StoreItem | null {
  if (!raw.appid || raw.success !== 1 || !raw.name) return null

  const header = raw.assets?.header && raw.assets.asset_url_format
    ? ASSET_BASE + raw.assets.asset_url_format.replace('${FILENAME}', raw.assets.header)
    : `https://cdn.cloudflare.steamstatic.com/steam/apps/${raw.appid}/header.jpg`
  const releaseSeconds = raw.release?.steam_release_date
  const summary = raw.reviews?.summary_filtered

  return {
    appId: raw.appid,
    name: raw.name,
    isGame: raw.type === 0,
    imageUrl: header,
    tags: (raw.tags || []).flatMap(tag => names.get(tag.tagid) || []),
    categoryIds: [...raw.categories?.supported_player_categoryids || [], ...raw.categories?.feature_categoryids || []],
    platforms: Object.entries({ windows: raw.platforms?.windows, mac: raw.platforms?.mac, linux: raw.platforms?.steamos_linux })
      .flatMap(([platform, supported]) => supported ? [platform] : []),
    free: Boolean(raw.is_free),
    comingSoon: Boolean(raw.release?.is_coming_soon) || (Boolean(releaseSeconds) && releaseSeconds! * 1000 > Date.now()),
    releaseDate: releaseSeconds ? new Date(releaseSeconds * 1000).toISOString().slice(0, 10) : undefined,
    reviewCount: summary?.review_count || 0,
    reviewPercent: summary?.review_count ? summary.percent_positive : undefined
  }
}

async function fetchStoreItemBatch(appIds: number[], apiKey: string, names: Map<number, string>) {
  const input = {
    ids: appIds.map(appid => ({ appid })),
    context: { language: 'english', country_code: 'US' },
    data_request: {
      include_tag_count: 15,
      include_reviews: true,
      include_release: true,
      include_platforms: true,
      include_assets: true,
      include_categories: true
    }
  }

  try {
    const result = await $fetch<StoreItemsResponse>(`${STEAM_API_BASE}/IStoreBrowseService/GetItems/v1/`, {
      query: { input_json: JSON.stringify(input) },
      headers: { 'x-webapi-key': apiKey },
      retry: 1,
      timeout: 15_000
    })
    const byId = new Map((result.response?.store_items || []).map(raw => [raw.appid, raw]))
    for (const appId of appIds) {
      const raw = byId.get(appId)
      storeCache.set(appId, { expiresAt: Date.now() + STORE_CACHE_TTL, value: raw ? toStoreItem(raw, names) : null })
    }
  } catch (error) {
    console.warn(`Steam store item request failed for ${appIds.length} apps`, error)
    for (const appId of appIds) storeCache.set(appId, { expiresAt: Date.now() + FAILURE_CACHE_TTL, value: null })
  }
}

/** Store data for many apps through Steam's batched Web API, cached per app. */
export async function getStoreItems(appIds: number[], apiKey: string) {
  const unique = [...new Set(appIds)]
  const missing = unique.filter((appId) => {
    const cached = storeCache.get(appId)
    return !cached || cached.expiresAt <= Date.now()
  })

  if (missing.length) {
    const names = await getTagNames(apiKey)
    const batches = Array.from({ length: Math.ceil(missing.length / STORE_ITEMS_BATCH) }, (_, index) =>
      missing.slice(index * STORE_ITEMS_BATCH, (index + 1) * STORE_ITEMS_BATCH))
    await Promise.all(batches.map(batch => fetchStoreItemBatch(batch, apiKey, names)))
  }

  const items = new Map<number, StoreItem>()
  for (const appId of unique) {
    const value = storeCache.get(appId)?.value
    if (value) items.set(appId, value)
  }
  return items
}

const SIMILAR_SECTIONS = ['released', 'comingsoon', 'newreleases', 'topselling'] as const

function parseSimilarSections(html: string, appId: number): SimilarApps {
  const markers = SIMILAR_SECTIONS
    .map(id => ({ id, index: html.indexOf(`id="${id}"`) }))
    .filter(marker => marker.index >= 0)
    .sort((a, b) => a.index - b.index)

  const section = (id: typeof SIMILAR_SECTIONS[number]) => {
    const position = markers.findIndex(marker => marker.id === id)
    if (position < 0) return []
    const chunk = html.slice(markers[position]!.index, markers[position + 1]?.index ?? html.length)
    const ids = Array.from(chunk.matchAll(/data-ds-appid="(\d+)"/g), match => Number(match[1]))
    return [...new Set(ids)].filter(candidate => candidate !== appId)
  }

  return { relevant: section('released').slice(0, 18), popular: section('topselling').slice(0, 18) }
}

async function getSimilarAppIds(appId: number): Promise<SimilarApps> {
  const cached = similarCache.get(appId)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  let value: SimilarApps = { relevant: [], popular: [] }
  let ttl = STORE_CACHE_TTL

  try {
    const html = await $fetch<string>(`${SIMILAR_API_BASE}/${appId}/`, {
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': 'FindGamesTogether/1.0'
      },
      responseType: 'text',
      retry: 1,
      timeout: 12_000
    })
    // Steam redirects apps without recommendations (or throttled requests) to a generic page.
    if (!html.includes('id="released"')) ttl = FAILURE_CACHE_TTL
    value = parseSimilarSections(html, appId)
  } catch (error) {
    ttl = FAILURE_CACHE_TTL
    console.warn(`Steam similar-games request failed for app ${appId}`, error)
  }

  similarCache.set(appId, { expiresAt: Date.now() + ttl, value })
  return value
}

export async function getSimilarApps(appIds: number[], concurrency = 4) {
  const results = Array.from<SimilarApps>({ length: appIds.length })
  let nextIndex = 0

  async function worker() {
    while (nextIndex < appIds.length) {
      const index = nextIndex++
      results[index] = await getSimilarAppIds(appIds[index]!)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, appIds.length) }, worker))
  return new Map(appIds.map((appId, index) => [appId, results[index]!]))
}
