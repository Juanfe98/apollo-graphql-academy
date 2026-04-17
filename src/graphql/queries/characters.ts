import { gql } from '@apollo/client'
import { CHARACTER_CORE_FRAGMENT } from '../fragments/characterCore'
import { CHARACTER_FULL_FRAGMENT } from '../fragments/characterFull'

export const GET_CHARACTERS = gql`
  query GetCharacters {
    characters {
      info {
        count
        pages
        next
        prev
      }
      results {
        ...CharacterCore
      }
    }
  }
  ${CHARACTER_CORE_FRAGMENT}
`

export const GET_CHARACTERS_PAGINATED = gql`
  query GetCharactersPaginated($page: Int, $filter: FilterCharacter) {
    characters(page: $page, filter: $filter) {
      info {
        count
        pages
        next
        prev
      }
      results {
        ...CharacterCore
      }
    }
  }
  ${CHARACTER_CORE_FRAGMENT}
`

export const GET_CHARACTER = gql`
  query GetCharacter($id: ID!) {
    character(id: $id) {
      ...CharacterFull
    }
  }
  ${CHARACTER_FULL_FRAGMENT}
`

export const GET_CHARACTER_CORE = gql`
  query GetCharacterCore($id: ID!) {
    character(id: $id) {
      ...CharacterCore
    }
  }
  ${CHARACTER_CORE_FRAGMENT}
`
