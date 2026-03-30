import { useEffect, useLayoutEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { stompManager } from '@/lib/stomp'

/**
 * Subscribes to a STOMP topic and calls `handler` for every message received.
 * Manages connection lifecycle — the STOMP client connects once and is shared
 * across all calls to this hook.
 *
 * @param topic  The STOMP destination to subscribe to, or null to skip.
 * @param handler  Called with the parsed JSON body of each incoming message.
 */
export function useStompSubscription(
  topic: string | null,
  handler: (body: unknown) => void,
) {
  const accessToken = useAuthStore(s => s.accessToken)
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
  const handlerRef = useRef(handler)
  useLayoutEffect(() => { handlerRef.current = handler })

  // Connect / reconnect whenever the token changes
  useEffect(() => {
    if (!accessToken) return
    stompManager.connect(accessToken, apiUrl)
  }, [accessToken, apiUrl])

  // Subscribe / unsubscribe when topic changes
  useEffect(() => {
    if (!topic || !accessToken) return
    const stableHandler = (body: unknown) => handlerRef.current(body)
    return stompManager.subscribe(topic, stableHandler)
  }, [topic, accessToken])
}
