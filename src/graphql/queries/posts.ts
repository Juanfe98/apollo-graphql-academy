import { gql } from '@apollo/client'

export const GET_POSTS = gql`
  query GetPosts {
    posts(options: { paginate: { limit: 5 } }) {
      data {
        id
        title
        body
        user {
          id
          name
        }
      }
    }
  }
`
