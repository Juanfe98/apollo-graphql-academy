import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { concepts } from '../data/concepts'

export function useKeyboardNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when user is typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const currentIndex = concepts.findIndex((c) => c.to === pathname)

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          if (currentIndex >= 0 && currentIndex < concepts.length - 1) {
            e.preventDefault()
            navigate(concepts[currentIndex + 1].to)
          }
          break
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          if (currentIndex > 0) {
            e.preventDefault()
            navigate(concepts[currentIndex - 1].to)
          }
          break
        }
        case 'Escape': {
          if (pathname !== '/') {
            e.preventDefault()
            navigate('/')
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pathname, navigate])
}
