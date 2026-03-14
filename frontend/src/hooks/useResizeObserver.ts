import {useCallback, useEffect, useRef, useState} from 'react'

export function useResizeObserver<T extends HTMLElement>(): [
  (node: T | null) => void,
  number,
] {
  const [width, setWidth] = useState(0)
  const observerRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: T | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!node) return
    observerRef.current = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    observerRef.current.observe(node)
    setWidth(node.getBoundingClientRect().width)
  }, [])

  useEffect(() => () => observerRef.current?.disconnect(), [])

  return [ref, width]
}
