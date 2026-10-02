import { createError, readBody } from 'h3'
import { STEAM_GENRES, type GameRecommendation, type RecommendationRequest, type RecommendationsResponse, type TasteGenre } from '~~/shared/types/steam'
import { getSimilarApps, getSteamLibraries, getSteamProfiles, getStoreItems, resolveSteamIds, type SteamOwnedGame, type StoreItem } from '~~/server/utils/steam'

const MAX_PROFILES = 6
const MAX_EXCLUDED_APPS = 500
// Each player's most-played games form their taste profile and the pool seeds are drawn from.
const FAVORITES_PER_PLAYER = 15
const SEEDS_PER_PLAYER = 5
const MIN_PLAYTIME_MINUTES = 60
const RECENT_PLAY_SECONDS = 180 * 24 * 60 * 60
const MAX_DETAIL_CANDIDATES = 100
const MAX_RESULTS = 24
// Each further result led by the same seed game counts this much less (up to three steps), keeping the list varied.
const SAME_SEED_FACTOR = 0.9
const MAX_SAME_SEED_STEPS = 3
// Games with fewer than MIN_REVIEWS_FOR_RATING reviews are uncertain picks.
const OBSCURE_FACTOR = 0.8
const POPULAR_SIGNAL_FACTOR = 0.6
const MIN_REVIEWS_FOR_RATING = 100
// Steam's "Mostly Positive" starts at 70%; below 65% is firmly Mixed.
const MIN_POSITIVE_SHARE = 0.65

// Steam store category ids.
const ONLINE_CATEGORIES = new Set([20, 27, 36, 38, 44])
const GENERIC_MULTIPLAYER_CATEGORIES = new Set([1, 9, 49])
const LOCAL_ONLY_CATEGORIES = new Set([24, 37, 39, 47, 48])
const CATEGORY_LABELS: Array<[number, string]> = [
  [38, 'Online Co-op'],
  [36, 'Online PvP'],
  [20, 'MMO'],
  [44, 'Remote Play Together'],
  [27, 'Cross-platform'],
  [9, 'Co-op'],
  [49, 'PvP'],
  [1, 'Multiplayer']
]
// Tags that describe modes or store features rather than what a game is like.
const META_TAGS = new Set(['Singleplayer', 'Multiplayer', 'Co-op', 'Online Co-Op', 'PvP', 'Online PvP', 'Local Co-Op', 'Local Multiplayer', 'Split Screen', 'Free to Play', 'Early Access', 'Great Soundtrack', 'Controller', 'Massively Multiplayer', 'Remote Play Together', 'Cross-Platform Multiplayer', 'Steam Workshop', 'VR', 'Moddable'])

interface Favorite {
  appId: number
  name: string
  playerIndex: number
  weight: number
}

interface CandidateSignal {
  /** Per player, the noisy-OR of every seed signal pointing at this game. */
  affinity: number[]
  seeds: Map<string, number>
}

function isOnlineMultiplayer(categoryIds: number[]) {
  if (categoryIds.some(id => ONLINE_CATEGORIES.has(id))) return true
  return categoryIds.some(id => GENERIC_MULTIPLAYER_CATEGORIES.has(id))
    && !categoryIds.some(id => LOCAL_ONLY_CATEGORIES.has(id))
}

function descriptiveTags(item: StoreItem) {
  return item.tags.filter(tag => !META_TAGS.has(tag))
}

function shuffle<T>(items: T[]) {
  const pool = [...items]
  for (let index = pool.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const selected = pool[swapIndex]!
    pool[swapIndex] = pool[index]!
    pool[index] = selected
  }
  return pool
}

/** Weighted random sample without replacement (Efraimidis–Spirakis). */
function weightedSample<T extends { weight: number }>(items: T[], count: number) {
  return items
    .map(item => ({ item, key: Math.random() ** (1 / Math.max(item.weight, 0.0001)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map(({ item }) => item)
}

/**
 * Picks the games that best describe a player: most played, with a boost for
 * recent sessions. Profiles that hide playtime fall back to a random sample.
 */
function pickFavorites(games: SteamOwnedGame[], playerIndex: number) {
  const now = Date.now() / 1000
  const played = games.filter(game => (game.playtime_forever || 0) >= MIN_PLAYTIME_MINUTES)

  if (played.length >= 3) {
    const favorites = played
      .map<Favorite>((game) => {
        const recentBoost = (game.playtime_2weeks ? 0.5 : 0)
          + (game.rtime_last_played && now - game.rtime_last_played < RECENT_PLAY_SECONDS ? 0.25 : 0)
        return {
          appId: game.appid,
          name: game.name || `Steam app ${game.appid}`,
          playerIndex,
          weight: Math.log1p((game.playtime_forever || 0) / 60) * (1 + recentBoost)
        }
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, FAVORITES_PER_PLAYER)
    return { favorites, playtimeVisible: true }
  }

  const favorites = shuffle(games)
    .slice(0, FAVORITES_PER_PLAYER)
    .map<Favorite>(game => ({ appId: game.appid, name: game.name || `Steam app ${game.appid}`, playerIndex, weight: 1 }))
  return { favorites, playtimeVisible: false }
}

function buildTasteProfile(favoritesByPlayer: Favorite[][], itemsById: Map<number, StoreItem>) {
  const playerGenres = favoritesByPlayer.map((favorites) => {
    const weights = new Map<string, number>()

    for (const favorite of favorites) {
      const item = itemsById.get(favorite.appId)
      if (!item) continue
      // A game's top tags describe it best.
      for (const [index, tag] of descriptiveTags(item).slice(0, 10).entries()) {
        weights.set(tag, (weights.get(tag) || 0) + favorite.weight / (1 + index * 0.3))
      }
    }

    const total = [...weights.values()].reduce((sum, weight) => sum + weight, 0)
    if (total) {
      for (const [genre, weight] of weights) weights.set(genre, weight / total)
    }
    return weights
  })

  const allGenres = new Set(playerGenres.flatMap(weights => [...weights.keys()]))
  const rawScores = [...allGenres].map((name) => {
    const scores = playerGenres.map(weights => weights.get(name) || 0)
    const coverage = scores.filter(Boolean).length / playerGenres.length
    const average = scores.reduce((sum, score) => sum + score, 0) / playerGenres.length
    return { name, score: average * (0.35 + coverage * 0.65) }
  }).sort((a, b) => b.score - a.score)

  const highest = rawScores[0]?.score || 1
  return rawScores.map<TasteGenre>(genre => ({
    name: genre.name,
    score: Math.round(genre.score / highest * 100)
  }))
}

/** 0–1. Rewards games that several players point to, without letting one player dominate. */
function groupFit(signal: CandidateSignal) {
  const players = signal.affinity.length
  const coverage = signal.affinity.filter(Boolean).length / players
  const spread = signal.affinity.reduce((sum, value) => sum + Math.sqrt(value), 0) / players
  return coverage * 0.4 + spread * 0.6
}

/** 0–1. How much of a game's character matches the group's shared taste. */
function tasteFit(item: StoreItem, tasteLookup: Map<string, number>) {
  const tags = descriptiveTags(item).slice(0, 8)
  if (!tags.length) return 0
  return tags.reduce((sum, tag) => sum + (tasteLookup.get(tag.toLowerCase()) || 0), 0) / tags.length
}

/** 0–1. Smoothed share of positive reviews, discounted when there are few reviews. */
function reviewQuality(item: StoreItem) {
  if (!item.reviewCount || item.reviewPercent === undefined) return 0.5
  const positive = item.reviewCount * item.reviewPercent / 100
  const ratio = (positive + 7) / (item.reviewCount + 10)
  const confidence = Math.min(1, Math.log10(item.reviewCount + 1) / 3.5)
  return ratio * (0.6 + 0.4 * confidence)
}

export default defineEventHandler(async (event): Promise<RecommendationsResponse> => {
  const apiKey = useRuntimeConfig(event).steamApiKey
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Steam integration is not configured. Add NUXT_STEAM_API_KEY to the server environment.'
    })
  }

  const body = await readBody<RecommendationRequest>(event)
  const profileInputs = Array.isArray(body?.profiles)
    ? body.profiles.map(profile => String(profile).trim()).filter(Boolean)
    : []

  if (profileInputs.length < 2 || profileInputs.length > MAX_PROFILES) {
    throw createError({ statusCode: 400, statusMessage: 'Add between 2 and 6 Steam profiles.' })
  }

  const allowedGenres = new Set<string>(STEAM_GENRES)
  const selectedGenres = Array.isArray(body.genres)
    ? [...new Set(body.genres.filter(genre => allowedGenres.has(genre)))]
    : []
  const toIdSet = (value: unknown) => new Set(Array.isArray(value)
    ? value.filter(appId => Number.isSafeInteger(appId) && appId > 0).slice(0, MAX_EXCLUDED_APPS) as number[]
    : [])
  const excludedAppIds = toIdSet(body.excludedAppIds)
  const excludedSeedIds = toIdSet(body.excludedSeedIds)

  const steamIds = await resolveSteamIds(profileInputs, apiKey)
  const [profileDetails, libraries] = await Promise.all([
    getSteamProfiles(steamIds, apiKey),
    getSteamLibraries(steamIds, apiKey)
  ])

  const unavailableIndex = libraries.findIndex(library => !library.games.length)
  if (unavailableIndex >= 0) {
    throw createError({
      statusCode: 422,
      statusMessage: `${profileDetails[unavailableIndex]!.name} has no visible games. Their Steam profile and Game details must be public.`
    })
  }

  const picks = libraries.map((library, playerIndex) => pickFavorites(library.games, playerIndex))
  const players = profileDetails.map((profile, index) => ({
    ...profile,
    gameCount: libraries[index]!.gameCount,
    playtimeVisible: picks[index]!.playtimeVisible
  }))

  const favoriteIds = [...new Set(picks.flatMap(pick => pick.favorites.map(favorite => favorite.appId)))]
  const itemsById = new Map([...await getStoreItems(favoriteIds, apiKey)].filter(([, item]) => item.isGame))

  // Software (wallpaper tools, editors) often tops playtime; only real games describe taste.
  const favoritesByPlayer = picks.map(pick => pick.favorites.filter(favorite => itemsById.has(favorite.appId)))
  const tasteProfile = buildTasteProfile(favoritesByPlayer, itemsById)
  const tasteLookup = new Map(tasteProfile.map(genre => [genre.name.toLowerCase(), genre.score / 100]))

  // Rerolls skip seeds already used, so each round starts from different favorites.
  const seeds = favoritesByPlayer.flatMap((favorites) => {
    const fresh = favorites.filter(favorite => !excludedSeedIds.has(favorite.appId))
    const pool = fresh.length >= Math.min(SEEDS_PER_PLAYER, favorites.length) ? fresh : favorites
    const highest = Math.max(...favorites.map(favorite => favorite.weight), 0.0001)
    return weightedSample(pool, SEEDS_PER_PLAYER)
      .map(favorite => ({ ...favorite, strength: 0.35 + 0.65 * favorite.weight / highest }))
  })
  if (!seeds.length) {
    throw createError({ statusCode: 502, statusMessage: 'Steam store data was unavailable for the games in these libraries. Please try again in a moment.' })
  }

  const uniqueSeedIds = [...new Set(seeds.map(seed => seed.appId))]
  const similarBySeed = await getSimilarApps(uniqueSeedIds)
  if (!uniqueSeedIds.some(appId => similarBySeed.get(appId)?.relevant.length)) {
    throw createError({ statusCode: 503, statusMessage: 'Steam is limiting requests right now, so no similar games came back. Try again in a few minutes.' })
  }
  const candidateSignals = new Map<number, CandidateSignal>()

  for (const seed of seeds) {
    const seedName = itemsById.get(seed.appId)?.name || seed.name
    const similar = similarBySeed.get(seed.appId)
    const lists: Array<[number[], number]> = [[similar?.relevant || [], 1], [similar?.popular || [], POPULAR_SIGNAL_FACTOR]]

    for (const [list, factor] of lists) {
      for (const [rank, candidateId] of list.entries()) {
        const strength = seed.strength * factor / (1 + rank * 0.15)
        const signal = candidateSignals.get(candidateId) || { affinity: players.map(() => 0), seeds: new Map() }
        signal.affinity[seed.playerIndex] = 1 - (1 - signal.affinity[seed.playerIndex]!) * (1 - strength)
        signal.seeds.set(seedName, Math.max(signal.seeds.get(seedName) || 0, strength))
        candidateSignals.set(candidateId, signal)
      }
    }
  }

  const libraryMaps = libraries.map(library => new Set(library.games.map(game => game.appid)))
  const rankedCandidates = [...candidateSignals.entries()]
    .filter(([appId]) => !excludedAppIds.has(appId) && !libraryMaps.every(library => library.has(appId)))
    .map(([appId, signal]) => ({ appId, signal, fit: groupFit(signal) }))
    .sort((a, b) => b.fit - a.fit)
  const detailCandidates = rankedCandidates.slice(0, MAX_DETAIL_CANDIDATES)
  const candidateItems = await getStoreItems(detailCandidates.map(candidate => candidate.appId), apiKey)

  const scored = detailCandidates
    .flatMap((candidate) => {
      const item = candidateItems.get(candidate.appId)
      if (!item?.isGame || item.comingSoon || !isOnlineMultiplayer(item.categoryIds)) return []
      if (selectedGenres.length && !selectedGenres.some(selected => item.tags.some(tag => tag.toLowerCase() === selected.toLowerCase()))) return []
      // Drop games rated Mixed or worse once there are enough reviews to tell.
      if (item.reviewCount >= MIN_REVIEWS_FOR_RATING && (item.reviewPercent ?? 100) < MIN_POSITIVE_SHARE * 100) return []
      const fit = candidate.fit * 0.8 + tasteFit(item, tasteLookup) * 0.2
      return [{ ...candidate, item, fit, rank: fit * (0.45 + 0.55 * reviewQuality(item)) }]
    })
    .sort((a, b) => b.rank - a.rank)

  // Pick greedily so the shown score is exactly what orders the list: each further game
  // led by the same seed is discounted for variety, barely reviewed games for uncertainty.
  const remaining = scored.map(candidate => ({
    ...candidate,
    primarySeed: [...candidate.signal.seeds.entries()].sort(([, a], [, b]) => b - a)[0]?.[0] || '',
    reviewFactor: candidate.item.reviewCount >= MIN_REVIEWS_FOR_RATING ? 1 : OBSCURE_FACTOR
  }))
  const perSeed = new Map<string, number>()
  const picked: Array<typeof remaining[number] & { match: number }> = []
  while (picked.length < MAX_RESULTS && remaining.length) {
    let bestIndex = 0
    let bestMatch = -1
    for (const [index, candidate] of remaining.entries()) {
      const match = candidate.rank * candidate.reviewFactor * SAME_SEED_FACTOR ** Math.min(perSeed.get(candidate.primarySeed) || 0, MAX_SAME_SEED_STEPS)
      if (match > bestMatch) {
        bestMatch = match
        bestIndex = index
      }
    }
    const [best] = remaining.splice(bestIndex, 1)
    perSeed.set(best!.primarySeed, (perSeed.get(best!.primarySeed) || 0) + 1)
    picked.push({ ...best!, match: bestMatch })
  }

  const games = picked.map<GameRecommendation>(({ appId, signal, item, match }) => {
    const playerStatuses = players.map((player, playerIndex) => ({
      steamId: player.steamId,
      name: player.name,
      owns: libraryMaps[playerIndex]!.has(appId)
    }))

    return {
      appId,
      name: item.name,
      imageUrl: item.imageUrl,
      storeUrl: `https://store.steampowered.com/app/${appId}`,
      genres: descriptiveTags(item).slice(0, 6),
      categories: CATEGORY_LABELS.filter(([id]) => item.categoryIds.includes(id)).slice(0, 3).map(([, label]) => label),
      platforms: item.platforms,
      recommendationCount: item.reviewCount,
      free: item.free,
      releaseDate: item.releaseDate,
      ownedByCount: playerStatuses.filter(player => player.owns).length,
      sourcePlayerCount: signal.affinity.filter(Boolean).length,
      players: playerStatuses,
      genreMatches: descriptiveTags(item).filter(tag => (tasteLookup.get(tag.toLowerCase()) || 0) >= 0.25),
      similarTo: [...signal.seeds.entries()].sort(([, a], [, b]) => b - a).slice(0, 3).map(([name]) => name),
      score: Math.min(99, Math.round(match * 100)),
      reviewScore: item.reviewPercent,
      reviewCount: item.reviewCount || undefined
    }
  })

  const warnings: string[] = []
  const hiddenPlaytime = players.filter(player => !player.playtimeVisible).map(player => player.name)
  if (hiddenPlaytime.length) {
    warnings.push(`${hiddenPlaytime.join(', ')} ${hiddenPlaytime.length === 1 ? 'hides' : 'hide'} playtime, so their taste comes from a random sample of their library.`)
  }
  const failedSeeds = uniqueSeedIds.filter(appId => !similarBySeed.get(appId)?.relevant.length).length
  if (failedSeeds > uniqueSeedIds.length / 2) warnings.push(`Steam did not return similar games for ${failedSeeds} source ${failedSeeds === 1 ? 'title' : 'titles'}.`)
  if (!games.length) {
    warnings.push(excludedAppIds.size
      ? 'No more online multiplayer recommendations were found. Start a new search to reset the reroll history.'
      : selectedGenres.length
        ? 'No online multiplayer recommendations matched the selected genres. Try removing the genre filter.'
        : 'Steam did not return any online multiplayer recommendations for these libraries.')
  }

  return {
    players,
    games,
    tasteProfile: tasteProfile.slice(0, 8),
    sourceGameCount: uniqueSeedIds.length,
    candidateGameCount: rankedCandidates.length,
    analyzedGameCount: detailCandidates.length,
    warnings,
    seedAppIds: uniqueSeedIds,
    generatedAt: new Date().toISOString()
  }
})
