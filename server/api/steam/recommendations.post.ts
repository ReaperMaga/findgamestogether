import { createError, readBody } from 'h3'
import { STEAM_GENRES, type GameRecommendation, type RecommendationRequest, type RecommendationsResponse, type TasteGenre } from '~~/shared/types/steam'
import { getSimilarApps, getSteamLibraries, getSteamProfiles, getStoreDetails, resolveSteamIds, type SteamOwnedGame, type StoreDetails } from '~~/server/utils/steam'

const MAX_PROFILES = 6
const SOURCE_GAMES_PER_PLAYER = 12
const SEEDS_PER_PLAYER = 4
const MAX_CANDIDATES = 80
const MAX_EXCLUDED_APPS = 500
const MULTIPLAYER_PATTERN = /multi.?player|co.?op|cooperative|pvp|shared.?split screen|remote play together|lan/i

interface TasteGame extends SteamOwnedGame {
  playerIndex: number
}

interface CandidateSignal {
  playerSignals: Map<number, number>
  seeds: Map<string, number>
}

function buildTasteProfile(gamesByPlayer: TasteGame[][], detailsById: Map<number, StoreDetails>) {
  const playerGenres = gamesByPlayer.map((games) => {
    const weights = new Map<string, number>()

    for (const game of games) {
      const details = detailsById.get(game.appid)
      if (!details || details.type !== 'game') continue
      for (const genre of details.genres) weights.set(genre, (weights.get(genre) || 0) + 1)
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

function candidatePriority(signal: CandidateSignal, playerCount: number) {
  const coverage = signal.playerSignals.size / playerCount
  const averageSignal = [...signal.playerSignals.values()].reduce((sum, value) => sum + value, 0) / playerCount
  return coverage * 100 + averageSignal
}

function sampleGames<T>(games: T[], count: number) {
  const pool = [...games]
  const sampleSize = Math.min(count, pool.length)

  for (let index = 0; index < sampleSize; index++) {
    const swapIndex = index + Math.floor(Math.random() * (pool.length - index))
    const selected = pool[swapIndex]!
    pool[swapIndex] = pool[index]!
    pool[index] = selected
  }

  return pool.slice(0, sampleSize)
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
  const excludedAppIds = new Set(Array.isArray(body.excludedAppIds)
    ? body.excludedAppIds
        .filter(appId => Number.isSafeInteger(appId) && appId > 0)
        .slice(0, MAX_EXCLUDED_APPS)
    : [])

  const steamIds = await resolveSteamIds(profileInputs, apiKey)
  const [profileDetails, libraries] = await Promise.all([
    getSteamProfiles(steamIds, apiKey),
    getSteamLibraries(steamIds, apiKey)
  ])
  const players = profileDetails.map((profile, index) => ({
    ...profile,
    gameCount: libraries[index]?.gameCount || 0
  }))

  const unavailablePlayer = players.find((player, index) => !libraries[index]?.games.length)
  if (unavailablePlayer) {
    throw createError({
      statusCode: 422,
      statusMessage: `${unavailablePlayer.name} has no visible games. Their Steam profile and Game details must be public.`
    })
  }

  const gamesByPlayer = libraries.map((library, playerIndex) => {
    return sampleGames(library.games, SOURCE_GAMES_PER_PLAYER)
      .map<TasteGame>(game => ({ ...game, playerIndex }))
  })

  const sourceAppIds = [...new Set(gamesByPlayer.flatMap(games => games.map(game => game.appid)))]
  const sourceDetails = await getStoreDetails(sourceAppIds, 8)
  const detailsById = new Map<number, StoreDetails>()
  sourceDetails.forEach((details) => {
    if (details) detailsById.set(details.appId, details)
  })
  const tasteProfile = buildTasteProfile(gamesByPlayer, detailsById)
  const tasteLookup = new Map(tasteProfile.map(genre => [genre.name.toLowerCase(), genre.score / 100]))

  const seedGames = gamesByPlayer.flatMap(games => games
    .filter(game => detailsById.get(game.appid)?.type === 'game')
    .slice(0, SEEDS_PER_PLAYER))
  if (!seedGames.length) {
    throw createError({ statusCode: 502, statusMessage: 'Steam Store details were unavailable for the games in these play histories.' })
  }

  const uniqueSeedIds = [...new Set(seedGames.map(game => game.appid))]
  const similarBySeed = await getSimilarApps(uniqueSeedIds)
  const candidateSignals = new Map<number, CandidateSignal>()

  for (const seed of seedGames) {
    const seedName = detailsById.get(seed.appid)?.name || seed.name || `Steam app ${seed.appid}`
    for (const [rank, candidateId] of (similarBySeed.get(seed.appid) || []).entries()) {
      const signalStrength = 1 / (1 + rank * 0.1)
      const signal = candidateSignals.get(candidateId) || { playerSignals: new Map(), seeds: new Map() }
      signal.playerSignals.set(seed.playerIndex, Math.max(signal.playerSignals.get(seed.playerIndex) || 0, signalStrength))
      signal.seeds.set(seedName, Math.max(signal.seeds.get(seedName) || 0, signalStrength))
      candidateSignals.set(candidateId, signal)
    }
  }

  const libraryMaps = libraries.map(library => new Map(library.games.map(game => [game.appid, game])))
  const rankedCandidates = [...candidateSignals.entries()]
    .filter(([appId]) => !excludedAppIds.has(appId) && !libraryMaps.every(library => library.has(appId)))
    .sort(([, a], [, b]) => candidatePriority(b, players.length) - candidatePriority(a, players.length))
  const candidates = rankedCandidates.slice(0, MAX_CANDIDATES)
  const candidateDetails = await getStoreDetails(candidates.map(([appId]) => appId), 8)
  const games: GameRecommendation[] = []

  for (const [index, [appId, signal]] of candidates.entries()) {
    const details = candidateDetails[index]
    if (!details || details.type !== 'game') continue
    if (!details.categories.some(category => MULTIPLAYER_PATTERN.test(category))) continue

    const manualGenreMatches = selectedGenres.filter(selected =>
      details.genres.some(genre => genre.toLowerCase() === selected.toLowerCase())
    )
    if (selectedGenres.length && !manualGenreMatches.length) continue

    const sourceCoverage = signal.playerSignals.size / players.length
    const averageSignal = [...signal.playerSignals.values()].reduce((sum, value) => sum + value, 0) / players.length
    const score = Math.round((sourceCoverage * 0.7 + averageSignal * 0.3) * 100)
    const playerStatuses = players.map((player, playerIndex) => {
      const ownedGame = libraryMaps[playerIndex]!.get(appId)
      return {
        steamId: player.steamId,
        name: player.name,
        owns: Boolean(ownedGame)
      }
    })

    games.push({
      appId,
      name: details.name,
      imageUrl: details.imageUrl,
      storeUrl: `https://store.steampowered.com/app/${appId}`,
      genres: details.genres,
      categories: details.categories.filter(category => MULTIPLAYER_PATTERN.test(category)),
      platforms: details.platforms,
      metacritic: details.metacritic,
      recommendationCount: details.recommendationCount,
      free: details.free,
      releaseDate: details.releaseDate,
      ownedByCount: playerStatuses.filter(player => player.owns).length,
      sourcePlayerCount: signal.playerSignals.size,
      players: playerStatuses,
      genreMatches: details.genres.filter(genre => (tasteLookup.get(genre.toLowerCase()) || 0) >= 0.25),
      similarTo: [...signal.seeds.entries()].sort(([, a], [, b]) => b - a).slice(0, 3).map(([name]) => name),
      score
    })
  }

  games.sort((a, b) => b.score - a.score || (b.metacritic || 0) - (a.metacritic || 0))
  const warnings: string[] = []
  const failedSeeds = uniqueSeedIds.filter(appId => !similarBySeed.get(appId)?.length).length
  if (failedSeeds) warnings.push(`Steam did not return similar games for ${failedSeeds} source ${failedSeeds === 1 ? 'title' : 'titles'}.`)
  if (!games.length) {
    warnings.push(excludedAppIds.size
      ? 'No more multiplayer recommendations were found. Start a new search to reset the reroll history.'
      : selectedGenres.length
      ? 'No multiplayer recommendations matched the selected genre preferences. Try removing the preference filter.'
      : 'Steam did not return any multiplayer recommendations for these play histories.')
  }

  return {
    players,
    games,
    tasteProfile: tasteProfile.slice(0, 8),
    sourceGameCount: detailsById.size,
    candidateGameCount: rankedCandidates.length,
    analyzedGameCount: candidates.length,
    warnings,
    generatedAt: new Date().toISOString()
  }
})
