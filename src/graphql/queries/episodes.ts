import { gql } from '@apollo/client'
import { EPISODE_CORE_FRAGMENT } from '../fragments/episodeCore'
import { CHARACTER_CORE_FRAGMENT } from '../fragments/characterCore'

export const GET_EPISODES = gql`
  query GetEpisodes($page: Int) {
    episodes(page: $page) {
      info {
        count
        pages
        next
        prev
      }
      results {
        ...EpisodeCore
      }
    }
  }
  ${EPISODE_CORE_FRAGMENT}
`

export const GET_EPISODE_WITH_CHARACTERS = gql`
  query GetEpisodeWithCharacters($id: ID!) {
    episode(id: $id) {
      ...EpisodeCore
      characters {
        ...CharacterCore
      }
    }
  }
  ${EPISODE_CORE_FRAGMENT}
  ${CHARACTER_CORE_FRAGMENT}
`
