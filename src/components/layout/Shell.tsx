import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'

export function Shell() {
  useKeyboardNav()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
