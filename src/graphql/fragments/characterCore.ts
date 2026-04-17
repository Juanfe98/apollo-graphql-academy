import { gql } from '@apollo/client'

// Used everywhere a character summary is needed.
// This fragment being shared across queries is what demonstrates
// Apollo's normalized cache deduplication (Concept 4).
export const CHARACTER_CORE_FRAGMENT = gql`
  fragment CharacterCore on Character {
    id
    name
    status
    species
    gender
    image
  }
`
