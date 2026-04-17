import { NavLink } from 'react-router-dom'
import { concepts } from '../../data/concepts'

const groups = ['Beginner', 'Intermediate', 'Advanced'] as const

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

        {groups.map((group) => (
          <div key={group} className="mb-4">
            <p className={`text-xs font-semibold mb-2 ${groupColor[group]}`}>
              {group}
            </p>
            <ul className="space-y-0.5">
              {concepts
                .filter((c) => c.level === group)
                .map((item) => (
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
                      {item.num} · {item.title}
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
