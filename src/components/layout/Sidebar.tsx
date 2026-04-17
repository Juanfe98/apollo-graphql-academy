import { NavLink } from 'react-router-dom'

const concepts = [
  { group: 'Beginner', items: [
    { to: '/concepts/basic-query',   label: '01 · Basic Queries' },
    { to: '/concepts/variables',     label: '02 · Variables & Arguments' },
    { to: '/concepts/lazy-query',    label: '03 · Lazy Queries' },
    { to: '/concepts/aliases',       label: '20 · Aliases' },
  ]},
  { group: 'Intermediate', items: [
    { to: '/concepts/fragments',         label: '04 · Fragments' },
    { to: '/concepts/pagination',        label: '05 · Pagination' },
    { to: '/concepts/cursor-pagination', label: '24 · Cursor Pagination' },
    { to: '/concepts/fetch-policies',    label: '06 · Fetch Policies' },
    { to: '/concepts/cache-rw',          label: '07 · Cache Read & Write' },
    { to: '/concepts/use-mutation',      label: '13 · useMutation' },
    { to: '/concepts/polling',           label: '16 · Polling' },
    { to: '/concepts/directives',        label: '18 · Directives' },
    { to: '/concepts/introspection',     label: '21 · Introspection' },
    { to: '/concepts/interfaces-unions', label: '22 · Interfaces & Unions' },
    { to: '/concepts/custom-scalars',    label: '23 · Custom Scalars' },
  ]},
  { group: 'Advanced', items: [
    { to: '/concepts/cache-invalidation', label: '08 · Cache Invalidation' },
    { to: '/concepts/optimistic-ui',      label: '09 · Optimistic UI' },
    { to: '/concepts/reactive-vars',      label: '10 · Reactive Variables' },
    { to: '/concepts/type-policies',      label: '11 · Type Policies' },
    { to: '/concepts/error-handling',     label: '12 · Error Handling' },
    { to: '/concepts/link-chain',         label: '14 · Link Chain' },
    { to: '/concepts/use-fragment',       label: '15 · useFragment' },
    { to: '/concepts/subscriptions',      label: '17 · Subscriptions' },
    { to: '/concepts/testing',            label: '19 · Testing' },
    { to: '/concepts/suspense-query',     label: '25 · useSuspenseQuery' },
    { to: '/concepts/background-query',   label: '26 · useBackgroundQuery' },
    { to: '/concepts/loadable-query',     label: '27 · useLoadableQuery' },
    { to: '/concepts/defer',              label: '28 · @defer' },
    { to: '/concepts/batch-http',         label: '29 · BatchHttpLink' },
    { to: '/concepts/persisted-queries',  label: '30 · Persisted Queries' },
    { to: '/concepts/federation',         label: '31 · Federation' },
    { to: '/concepts/file-uploads',       label: '32 · File Uploads' },
  ]},
]

const groupColor: Record<string, string> = {
  Beginner:     'text-green-500',
  Intermediate: 'text-yellow-500',
  Advanced:     'text-red-500',
}

export function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-800 bg-gray-950 overflow-y-auto">
      <div className="p-4">
        <NavLink to="/" className="block mb-6">
          <p className="text-indigo-400 font-bold text-sm">Apollo</p>
          <p className="text-white font-bold text-sm">GraphQL Academy</p>
        </NavLink>

        {concepts.map((group) => (
          <div key={group.group} className="mb-4">
            <p className={`text-xs font-semibold mb-2 ${groupColor[group.group]}`}>
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block text-xs px-2 py-1.5 rounded transition-colors ${
                        isActive
                          ? 'bg-indigo-700 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
