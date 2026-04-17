import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'apollo-academy-progress'
const STREAK_KEY = 'apollo-academy-streak'

interface StreakData {
  current: number
  lastDate: string
}

function getCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveCompleted(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    return raw ? JSON.parse(raw) : { current: 0, lastDate: '' }
  } catch {
    return { current: 0, lastDate: '' }
  }
}

function updateStreak() {
  const streak = getStreak()
  const today = new Date().toISOString().split('T')[0]

  if (streak.lastDate === today) return streak

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const newStreak: StreakData = {
    current: streak.lastDate === yesterday ? streak.current + 1 : 1,
    lastDate: today,
  }
  localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak))
  return newStreak
}

let listeners: Array<() => void> = []
let snapshot = { completed: getCompleted(), streak: getStreak() }

function emitChange() {
  snapshot = { completed: getCompleted(), streak: getStreak() }
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot() {
  return snapshot
}

export function useProgress() {
  const { completed, streak } = useSyncExternalStore(subscribe, getSnapshot)

  const toggleComplete = useCallback((conceptPath: string) => {
    const current = getCompleted()
    if (current.has(conceptPath)) {
      current.delete(conceptPath)
    } else {
      current.add(conceptPath)
      updateStreak()
    }
    saveCompleted(current)
    emitChange()
  }, [])

  const isCompleted = useCallback(
    (conceptPath: string) => completed.has(conceptPath),
    [completed],
  )

  return {
    completed,
    streak,
    completedCount: completed.size,
    toggleComplete,
    isCompleted,
  }
}
