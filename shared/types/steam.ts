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
  excludedAppIds?: number[]
}

export interface SteamPlayer {
  steamId: string
  name: string
  avatarUrl: string
  profileUrl: string
  gameCount: number
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
  score: number
}

export interface RecommendationsResponse {
  players: SteamPlayer[]
  games: GameRecommendation[]
  tasteProfile: TasteGenre[]
  sourceGameCount: number
  candidateGameCount: number
  analyzedGameCount: number
  warnings: string[]
  generatedAt: string
}
