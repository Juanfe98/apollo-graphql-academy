// Types matching the GraphQLZero API schema (https://graphqlzero.almansi.me/api)
// A free public GraphQL API with real CRUD mutations — based on JSONPlaceholder.

export interface GZUser {
  id: string
  name: string
  email?: string
}

export interface GZPost {
  __typename?: string
  id: string
  title: string
  body: string
  user?: GZUser
}

export interface GZPostsResult {
  data: GZPost[]
}

export interface CreatePostInput {
  title: string
  body: string
  userId: number
}

export interface UpdatePostInput {
  title?: string
  body?: string
}
