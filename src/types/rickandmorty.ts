// Hand-written types matching the Rick & Morty GraphQL schema.
// In production you'd generate these with @graphql-codegen/cli.

export interface Info {
  count: number
  pages: number
  next: number | null
  prev: number | null
}

export interface Location {
  id: string
  name: string
  type: string
  dimension: string
  residents?: Character[]
}

export interface Episode {
  id: string
  name: string
  air_date: string
  episode: string
  characters?: Character[]
}

export interface Character {
  id: string
  name: string
  status: 'Alive' | 'Dead' | 'unknown'
  species: string
  type: string
  gender: string
  image: string
  origin?: Location
  location?: Location
  episode?: Episode[]
  // Local-only fields (resolved by Apollo type policies, not the server)
  isFavorited?: boolean
  localNote?: string
}

export interface CharactersResult {
  info: Info
  results: Character[]
}

export interface EpisodesResult {
  info: Info
  results: Episode[]
}

export interface LocationsResult {
  info: Info
  results: Location[]
}

export interface FilterCharacter {
  name?: string
  status?: string
  species?: string
  type?: string
  gender?: string
}
