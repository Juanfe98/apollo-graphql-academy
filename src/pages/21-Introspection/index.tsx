import { useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'

const INTROSPECT_CHARACTER = gql`
  query IntrospectCharacterType {
    __type(name: "Character") {
      name
      kind
      description
      fields {
        name
        description
        type { name kind ofType { name kind ofType { name kind } } }
      }
    }
  }
`

const INTROSPECT_SCHEMA = gql`
  query IntrospectSchema {
    __schema {
      queryType { name }
      mutationType { name }
      types {
        name
        kind
        description
      }
    }
  }
`

type GQLFieldType = { name: string | null; kind: string; ofType?: GQLFieldType | null }
type GQLField = { name: string; description: string | null; type: GQLFieldType }
type IntrospectCharacterResult = {
  __type: {
    name: string
    kind: string
    description: string | null
    fields: GQLField[]
  } | null
}
type IntrospectSchemaResult = {
  __schema: {
    queryType: { name: string }
    mutationType: { name: string } | null
    types: { name: string; kind: string; description: string | null }[]
  }
}

function resolveTypeName(type: GQLFieldType): string {
  if (type.kind === 'NON_NULL') return `${resolveTypeName(type.ofType!)}!`
  if (type.kind === 'LIST') return `[${resolveTypeName(type.ofType!)}]`
  return type.name ?? '?'
}

const kindColor: Record<string, string> = {
  SCALAR: 'text-yellow-400',
  OBJECT: 'text-blue-400',
  INTERFACE: 'text-purple-400',
  UNION: 'text-pink-400',
  ENUM: 'text-green-400',
  INPUT_OBJECT: 'text-orange-400',
  NON_NULL: 'text-gray-400',
  LIST: 'text-gray-400',
}

const SNIPPET_TABS = [
  {
    label: '__typename',
    code: `
// __typename is the simplest introspection field — available on EVERY object.
// Apollo adds it automatically to every query for cache normalization.
// You can request it explicitly to know the type at runtime.

const { data } = useQuery(gql\`
  query {
    character(id: "1") {
      __typename   // → "Character"
      name
    }
  }
\`)

console.log(data.character.__typename) // "Character"`,
  },
  {
    label: '__type',
    code: `
// __type(name: "TypeName") returns the schema definition for a type.
// Use it to discover fields, kinds, and relationships at runtime.

query IntrospectCharacter {
  __type(name: "Character") {
    name
    kind          # OBJECT, INTERFACE, UNION, SCALAR, ENUM, INPUT_OBJECT
    description
    fields {
      name
      type {
        name
        kind
        ofType { name kind }  # unwrap NON_NULL / LIST wrappers
      }
    }
  }
}`,
  },
  {
    label: '__schema',
    code: `
// __schema returns metadata about the entire schema.
// Useful for introspection-based tooling (schema explorers, code generators).

query IntrospectSchema {
  __schema {
    queryType    { name }  # Root query type (usually "Query")
    mutationType { name }  # Root mutation type (or null if no mutations)
    types {
      name
      kind
    }
  }
}`,
  },
  {
    label: 'possibleTypes',
    code: `
// When your schema has interfaces or unions, Apollo needs possibleTypes
// to correctly normalize polymorphic query results.
// Generate this config from introspection:

// 1. Run a full schema introspection query (or use Apollo CLI):
// npx apollo client:download-schema schema.json --endpoint=http://...

// 2. Configure InMemoryCache:
import { InMemoryCache } from '@apollo/client'
import generatedIntrospection from './fragmentTypes.json'

const cache = new InMemoryCache({
  possibleTypes: generatedIntrospection.possibleTypes,
  // or hardcode manually:
  // possibleTypes: {
  //   SearchResult: ['Character', 'Location', 'Episode'],
  // }
})`,
  },
]

export default function Introspection() {
  const [tab, setTab] = useState<'type' | 'schema'>('type')

  const { data: typeData, loading: typeLoading } = useQuery<IntrospectCharacterResult>(
    INTROSPECT_CHARACTER,
    { skip: tab !== 'type' }
  )
  const { data: schemaData, loading: schemaLoading } = useQuery<IntrospectSchemaResult>(
    INTROSPECT_SCHEMA,
    { skip: tab !== 'schema' }
  )

  const charType = typeData?.__type
  const schema = schemaData?.__schema

  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="21"
        title="Introspection"
        level="Intermediate"
        description="Introspection lets you query the schema itself — what types exist, what fields they have, and what relationships connect them. Apollo uses introspection internally for cache normalization. The live demo queries the Rick & Morty API schema directly."
        docsUrl="https://graphql.org/learn/introspection/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      {/* ── Live introspection demo ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Live demo — query the schema itself</h2>
          <p className="text-xs text-gray-400">These queries run against the real Rick & Morty API introspection endpoint.</p>
        </div>

        <div className="flex gap-2">
          <button className={tab === 'type' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('type')}>
            __type("Character")
          </button>
          <button className={tab === 'schema' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('schema')}>
            __schema
          </button>
        </div>

        {(typeLoading || schemaLoading) && (
          <div className="card animate-pulse h-24 flex items-center justify-center">
            <p className="text-xs text-gray-500">Querying schema...</p>
          </div>
        )}

        {tab === 'type' && charType && (
          <div className="space-y-3">
            <div className="card border-indigo-900">
              <p className="text-xs text-gray-500 mb-1">Type metadata</p>
              <div className="flex gap-4 text-xs">
                <span>name: <span className="text-white font-semibold">{charType.name}</span></span>
                <span>kind: <span className={`font-semibold ${kindColor[charType.kind] ?? 'text-white'}`}>{charType.kind}</span></span>
              </div>
              {charType.description && (
                <p className="text-xs text-gray-400 mt-1">{charType.description}</p>
              )}
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-2">Fields ({charType.fields.length})</p>
              {charType.fields.map((field) => (
                <div key={field.name} className="card py-1.5 px-3 flex items-center justify-between gap-3">
                  <code className="text-xs text-white">{field.name}</code>
                  <code className={`text-xs ${kindColor[field.type.kind] ?? 'text-gray-400'}`}>
                    {resolveTypeName(field.type)}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'schema' && schema && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="card border-blue-900">
                <p className="text-xs text-gray-500">queryType</p>
                <p className="text-white font-semibold">{schema.queryType.name}</p>
              </div>
              <div className="card border-gray-700">
                <p className="text-xs text-gray-500">mutationType</p>
                <p className="text-white font-semibold">{schema.mutationType?.name ?? 'null (no mutations)'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">
                All types ({schema.types.length}) — built-in introspection types start with <code className="text-indigo-400">__</code>
              </p>
              <div className="grid grid-cols-2 gap-1 max-h-72 overflow-y-auto">
                {schema.types
                  .filter((t) => !t.name.startsWith('__'))
                  .map((t) => (
                    <div key={t.name} className="flex items-center gap-2 card py-1 px-2">
                      <span className={`text-xs font-semibold w-20 flex-shrink-0 ${kindColor[t.kind] ?? 'text-gray-400'}`}>
                        {t.kind}
                      </span>
                      <code className="text-xs text-gray-300 truncate">{t.name}</code>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="card border-indigo-900">
          <p className="text-indigo-400 font-semibold mb-1">Why introspection matters</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Powers GraphQL IDEs and schema explorers (GraphiQL, Apollo Studio)</li>
            <li>Used by code generators (<code className="text-white">@graphql-codegen</code>) to produce TypeScript types</li>
            <li>Apollo Client uses it to validate <code className="text-white">possibleTypes</code> for interfaces/unions</li>
            <li>Enables client-side schema validation and autocomplete in editors</li>
          </ul>
        </div>
        <div className="card border-yellow-900">
          <p className="text-yellow-400 font-semibold mb-1">Disable in production</p>
          <p className="text-gray-400">
            Most production APIs disable introspection to hide schema details from attackers.
            Apollo Studio fetches the schema at build time, not at runtime, so introspection
            in CI is sufficient. Check your GraphQL server docs for how to disable it
            per-environment.
          </p>
        </div>
      </div>
    </div>
  )
}
