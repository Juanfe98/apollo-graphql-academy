import { useLocation } from 'react-router-dom'
import { useProgress } from '../../hooks/useProgress'

interface Props {
  number: string
  title: string
  description: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  docsUrl?: string
}

const levelClass = {
  Beginner: 'concept-badge-beginner',
  Intermediate: 'concept-badge-intermediate',
  Advanced: 'concept-badge-advanced',
}

export function ConceptHeader({ number, title, description, level, docsUrl }: Props) {
  const { pathname } = useLocation()
  const { isCompleted, toggleComplete } = useProgress()
  const completed = isCompleted(pathname)

  return (
    <div className="mb-6 border-b border-gray-800 pb-4 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-gray-600 text-sm font-semibold">#{number}</span>
            <span className={levelClass[level]}>{level}</span>
          </div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 text-sm mt-1 max-w-2xl">{description}</p>
          <div className="flex items-center gap-3 mt-2">
            <kbd className="text-[10px] text-gray-600 bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded">←</kbd>
            <kbd className="text-[10px] text-gray-600 bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded">→</kbd>
            <span className="text-[10px] text-gray-600">navigate concepts</span>
            <kbd className="text-[10px] text-gray-600 bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded ml-1">esc</kbd>
            <span className="text-[10px] text-gray-600">home</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => toggleComplete(pathname)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${
              completed
                ? 'bg-green-900 text-green-300 hover:bg-green-800'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
            title={completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {completed ? (
              <svg className="w-3.5 h-3.5 animate-check-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            )}
            {completed ? 'Completed' : 'Mark complete'}
          </button>
          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Apollo Docs ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
