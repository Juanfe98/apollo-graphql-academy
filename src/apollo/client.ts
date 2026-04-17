import { ApolloClient, HttpLink, from, CombinedGraphQLErrors } from '@apollo/client'
import { ErrorLink } from '@apollo/client/link/error'
import { cache } from './cache'
import { LocalState } from '@apollo/client/local-state'

// CONCEPT 12: Error link intercepts all GraphQL & network errors globally
const errorLink = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, path }) => {
      console.error(
        `[GraphQL error] Op: ${operation.operationName} | Path: ${path?.join('.')} | ${message}`
      )
    })
  } else {
    console.error(`[Network error]: ${error}`)
  }
})

const httpLink = new HttpLink({
  uri: 'https://rickandmortyapi.com/graphql',
})

export const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache,
  localState: new LocalState,
  // CONCEPT 12: errorPolicy:'all' surfaces partial data even when errors exist
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
  devtools: { enabled: true },
})
