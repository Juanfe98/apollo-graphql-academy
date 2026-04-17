interface LinkNode {
  name: string
  color: string
  active: boolean
  description: string
}

interface Props {
  links: LinkNode[]
}

export function LinkChainDiagram({ links }: Props) {
  return (
    <div className="card border-gray-700">
      <p className="text-xs text-gray-500 mb-3">Link execution order (request: left → right · response: right → left)</p>
      <div className="flex items-center gap-1 flex-wrap">
        {links.map((link, i) => (
          <div key={link.name} className="flex items-center gap-1">
            <div className={`relative px-3 py-2 rounded border text-xs font-semibold transition-all ${link.color} ${link.active ? 'shadow-lg scale-105' : 'opacity-70'}`}>
              {link.active && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              )}
              <span>{link.name}</span>
              <p className="text-xs font-normal opacity-70 mt-0.5 hidden sm:block">{link.description}</p>
            </div>
            {i < links.length - 1 && (
              <span className="text-gray-600 font-bold text-sm">→</span>
            )}
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-gray-600 font-bold text-sm">→</span>
          <span className="text-xs text-gray-500">🌐 Network</span>
        </div>
      </div>
    </div>
  )
}
