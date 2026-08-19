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

interface StoreItem {
  type?: string
  name?: string
  header_image?: string
  is_free?: boolean
  genres?: Array<{ description?: string }>
  categories?: Array<{ description?: string }>
  platforms?: Record<string, boolean>
  metacritic?: { score?: number }
  recommendations?: { total?: number }
  release_date?: { date?: string }
}

interface StoreEnvelope {
  success?: boolean
  data?: StoreItem
}

export interface StoreDetails {
  appId: number
  type: string
  name: string
  imageUrl: string
  genres: string[]
  categories: string[]
  platforms: string[]
  metacritic?: number
  recommendationCount?: number
  free: boolean
  releaseDate?: string
}

const STEAM_API_BASE = 'https://api.steampowered.com'
const STORE_API_BASE = 'https://store.steampowered.com/api/appdetails'
const SIMILAR_API_BASE = 'https://store.steampowered.com/recommended/morelike/app'
const STEAM_ID_PATTERN = /^7656119\d{10}$/
const STORE_CACHE_TTL = 12 * 60 * 60 * 1000
const storeCache = new Map<number, { expiresAt: number, value: StoreDetails | null }>()
const similarCache = new Map<number, { expiresAt: number, value: number[] }>()

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

async function getStoreDetail(appId: number): Promise<StoreDetails | null> {
  const cached = storeCache.get(appId)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  let value: StoreDetails | null = null

  try {
    const result = await $fetch<Record<string, StoreEnvelope>>(STORE_API_BASE, {
      query: { appids: appId, cc: 'us', l: 'en' },
      retry: 1,
      timeout: 10_000
    })
    const envelope = result[String(appId)]
    const data = envelope?.success ? envelope.data : undefined

    if (data?.name) {
      value = {
        appId,
        type: data.type || 'game',
        name: data.name,
        imageUrl: data.header_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
        genres: (data.genres || []).flatMap(genre => genre.description ? [genre.description] : []),
        categories: (data.categories || []).flatMap(category => category.description ? [category.description] : []),
        platforms: Object.entries(data.platforms || {}).flatMap(([platform, supported]) => supported ? [platform] : []),
        metacritic: data.metacritic?.score,
        recommendationCount: data.recommendations?.total,
        free: Boolean(data.is_free),
        releaseDate: data.release_date?.date
      }
    }
  } catch (error) {
    console.warn(`Steam Store metadata request failed for app ${appId}`, error)
  }

  storeCache.set(appId, { expiresAt: Date.now() + STORE_CACHE_TTL, value })
  return value
}

export async function getStoreDetails(appIds: number[], concurrency = 6) {
  const results: Array<StoreDetails | null> = Array.from({ length: appIds.length }, () => null)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < appIds.length) {
      const index = nextIndex++
      results[index] = await getStoreDetail(appIds[index]!)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, appIds.length) }, worker))
  return results
}

async function getSimilarAppIds(appId: number) {
  const cached = similarCache.get(appId)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  let value: number[] = []

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
    const found = Array.from(html.matchAll(/recommended\/morelike\/app\/(\d+)/g), match => Number(match[1]))
    value = [...new Set(found)].filter(candidate => candidate !== appId).slice(0, 18)
  } catch (error) {
    console.warn(`Steam similar-games request failed for app ${appId}`, error)
  }

  similarCache.set(appId, { expiresAt: Date.now() + STORE_CACHE_TTL, value })
  return value
}

export async function getSimilarApps(appIds: number[], concurrency = 5) {
  const entries: Array<[number, number[]]> = Array.from({ length: appIds.length }, () => [0, []])
  let nextIndex = 0

  async function worker() {
    while (nextIndex < appIds.length) {
      const index = nextIndex++
      const appId = appIds[index]!
      entries[index] = [appId, await getSimilarAppIds(appId)]
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, appIds.length) }, worker))
  return new Map(entries)
}
