import { gql } from '@apollo/client'

export const EPISODE_CORE_FRAGMENT = gql`
  fragment EpisodeCore on Episode {
    id
    name
    air_date
    episode
  }
`
