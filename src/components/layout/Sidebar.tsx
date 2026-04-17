import { NavLink } from 'react-router-dom'
import { concepts } from '../../data/concepts'
import { useProgress } from '../../hooks/useProgress'

const groups = ['Beginner', 'Intermediate', 'Advanced'] as const

const groupColor: Record<string, string> = {
  Beginner:     'text-green-500',
  Intermediate: 'text-yellow-500',
  Advanced:     'text-red-500',
}

export function Sidebar() {
  const { isCompleted } = useProgress()

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
                        `flex items-center gap-1.5 text-xs px-2 py-1.5 rounded transition-colors ${
                          isActive
                            ? 'bg-indigo-700 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`
                      }
                    >
                      {isCompleted(item.to) && (
                        <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>{item.num} · {item.title}</span>
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
