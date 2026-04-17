import { gql } from '@apollo/client'
import { LOCATION_CORE_FRAGMENT } from '../fragments/locationCore'

export const GET_LOCATIONS = gql`
  query GetLocations($page: Int) {
    locations(page: $page) {
      info {
        count
        pages
        next
        prev
      }
      results {
        ...LocationCore
      }
    }
  }
  ${LOCATION_CORE_FRAGMENT}
`
