import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'

const SNIPPET_TABS = [
  {
    label: 'What are custom scalars?',
    code: `
# GraphQL ships with 5 built-in scalars:
# String, Int, Float, Boolean, ID

# Custom scalars extend this for domain-specific types.
# The server defines them; the client parses/serializes them.

# Schema definition (SDL):
scalar Date         # ISO 8601 date string → JS Date object
scalar JSON         # Arbitrary JSON blob
scalar Upload       # Multipart file upload
scalar URL          # Validated URL string
scalar EmailAddress # Validated email address

type Character {
  id:        ID!
  name:      String!
  createdAt: Date!    # ← custom scalar
  metadata:  JSON     # ← custom scalar
}`,
  },
  {
    label: 'Scalar links',
    code: `
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { withScalars } from 'apollo-link-scalars'
import { buildClientSchema, IntrospectionQuery } from 'graphql'
import introspectionResult from './schema.json'

// 1. Build a client schema from your introspection result
const schema = buildClientSchema(introspectionResult as unknown as IntrospectionQuery)

// 2. Define parse/serialize for each custom scalar
const typesMap = {
  Date: {
    // serialize: called when sending a Date to the server (in variables)
    serialize: (parsed: Date) => parsed.toISOString(),
    // parseValue: called on data returned from the server
    parseValue: (raw: string | number | null): Date | null => {
      if (raw === null) return null
      return new Date(raw)
    },
  },
  JSON: {
    serialize: (value: unknown) => value,
    parseValue: (value: unknown) => value,
  },
}

// 3. Add the scalar link BEFORE HttpLink
export const client = new ApolloClient({
  link: ApolloLink.from([
    withScalars({ schema, typesMap }),
    new HttpLink({ uri: '/graphql' }),
  ]),
  cache: new InMemoryCache(),
})`,
  },
  {
    label: 'Date scalar example',
    code: `
// After configuring the Date scalar link, Apollo automatically
// converts ISO strings from the server into JS Date objects.

const { data } = useQuery(GET_CHARACTERS_WITH_DATES)

// Without scalar link:
console.log(data.character.createdAt)  // "2017-11-04T18:48:46.250Z" (string)
console.log(typeof data.character.createdAt)  // "string"

// With scalar link:
console.log(data.character.createdAt)  // Mon Nov 04 2024 18:48:46 (Date object)
console.log(typeof data.character.createdAt)  // "object"

// Now you can use date methods directly:
const formatted = data.character.createdAt.toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric'
})`,
  },
  {
    label: 'Upload scalar',
    code: `
// File uploads require:
// 1. createUploadLink instead of HttpLink (see page 32 - File Uploads)
// 2. The Upload scalar for the mutation input type

# Schema (SDL):
scalar Upload

type Mutation {
  uploadAvatar(file: Upload!): Character!
}

// Client usage:
const UPLOAD_AVATAR = gql\`
  mutation UploadAvatar($file: Upload!) {
    uploadAvatar(file: $file) { id image }
  }
\`

const [uploadAvatar] = useMutation(UPLOAD_AVATAR)

async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  await uploadAvatar({ variables: { file } })
  // Apollo serializes the File object via multipart/form-data
}`,
  },
  {
    label: 'TypeScript codegen',
    code: `
// graphql-codegen can generate TypeScript types for custom scalars.
// Configure in codegen.yml:

generates:
  src/generated/types.ts:
    plugins:
      - typescript
    config:
      scalars:
        Date: Date          # maps GraphQL Date → TS Date
        JSON: unknown       # maps GraphQL JSON → TS unknown
        URL: string         # maps GraphQL URL → TS string
        Upload: File        # maps GraphQL Upload → TS File

// The generated types then correctly type your query results:
interface Character {
  id: string
  name: string
  createdAt: Date    // ← TS Date, not string
  metadata: unknown  // ← TS unknown
}`,
  },
]

export default function CustomScalars() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="23"
        title="Custom Scalars"
        level="Intermediate"
        description="Custom scalars extend GraphQL's type system for domain-specific values like Date, JSON, or Upload. The server defines their serialization format; the client needs a scalar link to parse server values into native JS types and serialize JS types into the wire format."
        docsUrl="https://www.apollographql.com/docs/react/data/operation-best-practices/#using-custom-scalars"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Common custom scalars</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-400 border-collapse">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4 font-semibold">Scalar</th>
                <th className="text-left py-2 pr-4 font-semibold">Wire format</th>
                <th className="text-left py-2 pr-4 font-semibold">JS type after parsing</th>
                <th className="text-left py-2 font-semibold">Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[
                ['Date / DateTime', 'ISO 8601 string', 'Date', 'apollo-link-scalars'],
                ['JSON', 'Any JSON value', 'unknown / Record<string,any>', 'apollo-link-scalars'],
                ['Upload', 'multipart/form-data', 'File', 'apollo-upload-client'],
                ['URL', 'String', 'string (validated)', 'graphql-scalars'],
                ['EmailAddress', 'String', 'string (validated)', 'graphql-scalars'],
                ['BigInt / Long', 'String or Number', 'bigint', 'graphql-scalars'],
                ['UUID', 'String', 'string', 'graphql-scalars'],
              ].map(([scalar, wire, js, pkg]) => (
                <tr key={scalar} className="hover:bg-gray-900/50">
                  <td className="py-2 pr-4 font-mono text-yellow-300">{scalar}</td>
                  <td className="py-2 pr-4">{wire}</td>
                  <td className="py-2 pr-4 font-mono text-blue-300">{js}</td>
                  <td className="py-2 font-mono text-gray-500">{pkg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="card border-indigo-900">
          <p className="text-indigo-400 font-semibold mb-1">Without a scalar link</p>
          <p className="text-gray-400">
            Apollo returns custom scalar values exactly as the server sent them — usually as strings.
            You'd manually call <code className="text-white">new Date(data.createdAt)</code> everywhere,
            which is error-prone and easy to forget. A scalar link centralizes the conversion.
          </p>
        </div>
        <div className="card border-green-900">
          <p className="text-green-400 font-semibold mb-1">graphql-scalars library</p>
          <p className="text-gray-400">
            The <code className="text-white">graphql-scalars</code> package provides 50+ battle-tested
            scalar implementations (both server and client). Use them instead of rolling your own — they
            handle edge cases like timezone handling, BigInt precision, and validation.
          </p>
        </div>
      </div>
    </div>
  )
}
