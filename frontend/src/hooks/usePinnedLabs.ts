import { useState, useCallback } from 'react'

const PINNED_KEY = 'bentolab-pinned'
const RECENT_KEY = 'bentolab-recent'

function readStorage<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

export function usePinnedLabs() {
  const [pinned, setPinned] = useState<string[]>(() => readStorage<string[]>(PINNED_KEY, []))

  const togglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem(PINNED_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isPinned = useCallback((id: string) => pinned.includes(id), [pinned])

  return { pinned, togglePin, isPinned }
}

export function useRecentLabs() {
  const [recent, setRecent] = useState<string[]>(() => readStorage<string[]>(RECENT_KEY, []))

  const trackVisit = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 5)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { recent, trackVisit }
}
