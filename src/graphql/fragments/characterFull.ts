import { gql } from '@apollo/client'
import { CHARACTER_CORE_FRAGMENT } from './characterCore'

// Extends CharacterCore with relational data + @client local fields.
// The @client directive tells Apollo to resolve isFavorited and localNote
// from the InMemoryCache type policies (reactive vars), not the network.
export const CHARACTER_FULL_FRAGMENT = gql`
  fragment CharacterFull on Character {
    ...CharacterCore
    type
    origin {
      id
      name
      type
      dimension
    }
    location {
      id
      name
      type
      dimension
    }
    episode {
      id
      name
      episode
      air_date
    }
    isFavorited @client
    localNote @client
  }
  ${CHARACTER_CORE_FRAGMENT}
`
