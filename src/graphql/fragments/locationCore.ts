import { gql } from '@apollo/client'

export const LOCATION_CORE_FRAGMENT = gql`
  fragment LocationCore on Location {
    id
    name
    type
    dimension
  }
`
