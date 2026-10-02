export const STEAM_GENRES = [
  'Action',
  'Adventure',
  'Casual',
  'Indie',
  'Massively Multiplayer',
  'Racing',
  'RPG',
  'Simulation',
  'Sports',
  'Strategy'
] as const

export type SteamGenre = (typeof STEAM_GENRES)[number]

export interface RecommendationRequest {
  profiles: string[]
  genres?: SteamGenre[]
  /** Games already shown in this session; rerolls never repeat them. */
  excludedAppIds?: number[]
  /** Seed games already used in this session; rerolls start from different favorites. */
  excludedSeedIds?: number[]
}

export interface SteamPlayer {
  steamId: string
  name: string
  avatarUrl: string
  profileUrl: string
  gameCount: number
  /** False when the profile hides playtime, so seeds were sampled at random. */
  playtimeVisible: boolean
}

export interface PlayerGameStatus {
  steamId: string
  name: string
  owns: boolean
}

export interface TasteGenre {
  name: string
  score: number
}

export interface GameRecommendation {
  appId: number
  name: string
  imageUrl: string
  storeUrl: string
  genres: string[]
  categories: string[]
  platforms: string[]
  metacritic?: number
  recommendationCount?: number
  free: boolean
  releaseDate?: string
  ownedByCount: number
  sourcePlayerCount: number
  players: PlayerGameStatus[]
  genreMatches: string[]
  similarTo: string[]
  /** Match, 0–100: group fit weighted by review quality and variety. Results are ordered by it. */
  score: number
  /** Share of positive Steam reviews, 0–100, when known. */
  reviewScore?: number
  reviewCount?: number
}

export interface RecommendationsResponse {
  players: SteamPlayer[]
  games: GameRecommendation[]
  tasteProfile: TasteGenre[]
  sourceGameCount: number
  candidateGameCount: number
  analyzedGameCount: number
  warnings: string[]
  /** Seed games used for this result, so the next reroll can pick others. */
  seedAppIds: number[]
  generatedAt: string
}
