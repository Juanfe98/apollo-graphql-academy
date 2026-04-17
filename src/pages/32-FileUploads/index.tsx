import { ConceptHeader } from '../../components/shared/ConceptHeader'
import { CodeBlock } from '../../components/shared/CodeBlock'

const SNIPPET_TABS = [
  {
    label: 'Setup',
    code: `
// File uploads require createUploadLink instead of HttpLink.
// It implements the GraphQL multipart request spec.

import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client'
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs'

export const client = new ApolloClient({
  link: ApolloLink.from([
    // other links (auth, logging, etc.)
    createUploadLink({
      uri: '/graphql',
      headers: { 'Apollo-Require-Preflight': 'true' },  // CSRF protection
    }),
    // ↑ replaces HttpLink — handles both regular requests AND multipart uploads
  ]),
  cache: new InMemoryCache(),
})

// Install: npm install apollo-upload-client
// TypeScript types: npm install -D @types/apollo-upload-client`,
  },
  {
    label: 'Schema & mutation',
    code: `
# Server-side schema (SDL):
scalar Upload

type Mutation {
  uploadAvatar(file: Upload!): UploadResult!
  uploadFiles(files: [Upload!]!): [UploadResult!]!
}

type UploadResult {
  filename: String!
  mimetype: String!
  encoding: String!
  url:      String!
}

# Apollo Server 4 handles the Upload scalar natively.
# Other servers need the graphql-upload package.

const resolvers = {
  Mutation: {
    async uploadAvatar(_, { file }) {
      const { createReadStream, filename, mimetype } = await file
      // Save the stream to storage (S3, disk, etc.)
      const stream = createReadStream()
      const url = await saveToStorage(stream, filename)
      return { filename, mimetype, encoding: 'utf-8', url }
    }
  }
}`,
  },
  {
    label: 'Single file upload',
    code: `
const UPLOAD_AVATAR = gql\`
  mutation UploadAvatar($file: Upload!) {
    uploadAvatar(file: $file) {
      filename
      url
    }
  }
\`

function AvatarUpload() {
  const [uploadAvatar, { loading, data, error }] = useMutation(UPLOAD_AVATAR)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadAvatar({
      variables: { file },  // pass the File object directly
      // Apollo + createUploadLink serialize it as multipart/form-data
    })
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChange} />
      {loading && <p>Uploading...</p>}
      {data && <img src={data.uploadAvatar.url} alt="Avatar" />}
      {error && <p>Upload failed: {error.message}</p>}
    </div>
  )
}`,
  },
  {
    label: 'Multiple files',
    code: `
const UPLOAD_GALLERY = gql\`
  mutation UploadGallery($files: [Upload!]!) {
    uploadFiles(files: $files) {
      filename
      url
    }
  }
\`

function GalleryUpload() {
  const [uploadFiles, { loading }] = useMutation(UPLOAD_GALLERY)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    await uploadFiles({
      variables: { files },
      // Apollo serializes [File, File, File] as multipart/form-data
      // with indexed map entries per the GraphQL multipart spec
    })
  }

  return (
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={handleChange}
      disabled={loading}
    />
  )
}`,
  },
  {
    label: 'Upload progress',
    code: `
// Apollo Client doesn't expose upload progress natively.
// Use XMLHttpRequest or fetch with a custom link for progress tracking.

import { ApolloLink, Observable } from '@apollo/client'
import { extractFiles } from 'extract-files'

const uploadProgressLink = new ApolloLink((operation, forward) => {
  const { files, clone } = extractFiles(operation.variables)

  if (files.size === 0) return forward(operation)

  return new Observable((observer) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100)
        console.log(\`Upload: \${pct}%\`)
        // Use a reactive var or state to track this
      }
    }

    // Build multipart body manually or use apollo-upload-client internals
    // ...
  })
})`,
  },
]

export default function FileUploadsPage() {
  return (
    <div className="w-full space-y-6">
      <ConceptHeader
        number="32"
        title="File Uploads"
        level="Advanced"
        description="Apollo Client supports file uploads via the GraphQL multipart request spec. The createUploadLink from apollo-upload-client replaces HttpLink and handles multipart/form-data serialization. Pass File objects directly as mutation variables — Apollo does the rest."
        docsUrl="https://www.apollographql.com/docs/react/data/file-uploads/"
      />

      <CodeBlock tabs={SNIPPET_TABS} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Multipart request spec — what Apollo sends</h2>
        <div className="code-block text-xs">
          <pre>{`// A file upload mutation becomes a multipart/form-data POST:
//
// --------------------------boundary
// Content-Disposition: form-data; name="operations"
//
// {"query":"mutation Upload($file:Upload!){uploadAvatar(file:$file){url}}","variables":{"file":null}}
// --------------------------boundary
// Content-Disposition: form-data; name="map"
//
// {"0":["variables.file"]}
// --------------------------boundary
// Content-Disposition: form-data; name="0"; filename="avatar.jpg"
// Content-Type: image/jpeg
//
// <binary file data>
// --------------------------boundary--
//
// The "map" field tells the server how to substitute each file
// into the operation variables. Apollo handles this automatically.`}</pre>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="card border-green-900">
          <p className="text-green-400 font-semibold mb-2">Server requirements</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Apollo Server 4 — supports Upload scalar natively</li>
            <li>GraphQL Yoga — supports multipart uploads out of the box</li>
            <li>Other servers — need <code className="text-white">graphql-upload</code> middleware</li>
            <li>Must handle <code className="text-white">multipart/form-data</code> Content-Type</li>
          </ul>
        </div>
        <div className="card border-yellow-900">
          <p className="text-yellow-400 font-semibold mb-2">Security considerations</p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li>Always validate file type on the server (MIME type can be spoofed)</li>
            <li>Enforce file size limits server-side</li>
            <li>Set <code className="text-white">Apollo-Require-Preflight: true</code> header to prevent CSRF</li>
            <li>Virus-scan uploaded files before storing</li>
            <li>Store in object storage (S3, GCS), not on the GraphQL server</li>
          </ul>
        </div>
      </div>

      <div className="card border-indigo-900 text-xs space-y-2">
        <p className="text-indigo-400 font-semibold">Alternative: pre-signed URL pattern</p>
        <p className="text-gray-400">
          For large files or advanced upload control, consider the <strong className="text-white">pre-signed URL pattern</strong>:
          a GraphQL mutation returns a pre-signed S3/GCS URL, then the client uploads directly to the
          storage service — bypassing the GraphQL server entirely. This avoids size limits and reduces
          load on the API server. Use <code className="text-white">createUploadLink</code> only when direct-to-storage
          isn't available.
        </p>
      </div>
    </div>
  )
}
