import { useState } from 'react'

interface Tab {
  label: string
  code: string
}

interface Props {
  tabs?: Tab[]
  code?: string
  label?: string
}

export function CodeBlock({ tabs, code, label }: Props) {
  const [active, setActive] = useState(0)

  if (code) {
    return (
      <div>
        {label && <p className="text-xs text-gray-500 mb-1">{label}</p>}
        <pre className="code-block whitespace-pre-wrap">{code.trim()}</pre>
      </div>
    )
  }

  if (!tabs) return null

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              i === active
                ? 'bg-indigo-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <pre className="code-block whitespace-pre-wrap">{tabs[active].code.trim()}</pre>
    </div>
  )
}
