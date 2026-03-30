import { Client, type IMessage } from '@stomp/stompjs'

type MessageHandler = (body: unknown) => void

class StompManager {
  private client: Client | null = null
  private currentToken: string | null = null
  // topic → handlers (one STOMP subscription per topic, dispatched to all handlers)
  private handlers = new Map<string, Set<MessageHandler>>()
  // topic → stomp subscription handle (for unsubscribe)
  private stompSubs = new Map<string, { unsubscribe: () => void }>()
  // Messages sent before connection was established — flushed on connect
  private pendingPublish: Array<{ destination: string; body: string }> = []

  connect(token: string, apiUrl: string) {
    if (this.currentToken === token && this.client?.active) return

    this.client?.deactivate()
    this.handlers.clear()
    this.stompSubs.clear()

    this.currentToken = token
    const wsBase = apiUrl.replace(/^http/, 'ws')

    this.client = new Client({
      brokerURL: `${wsBase}/ws?token=${encodeURIComponent(token)}`,
      reconnectDelay: 5000,
      onConnect:    () => this.onConnected(),
      onStompError: (frame) => console.error('[STOMP] error', frame),
    })
    this.client.activate()
  }

  private onConnected() {
    if (!this.client) return
    // Flush messages that were sent before the connection was ready
    const pending = this.pendingPublish.splice(0)
    pending.forEach(msg => this.client!.publish(msg))
    // Resubscribe all active topics after reconnect
    this.stompSubs.clear()
    this.handlers.forEach((_, topic) => {
      const sub = this.client!.subscribe(topic, (msg: IMessage) => this.dispatch(topic, msg.body))
      this.stompSubs.set(topic, sub)
    })
  }

  private dispatch(topic: string, body: string) {
    try {
      const parsed = JSON.parse(body)
      this.handlers.get(topic)?.forEach(h => h(parsed))
    } catch {
      // ignore malformed messages
    }
  }

  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set())
      // If already connected, add the STOMP subscription immediately
      if (this.client?.connected) {
        const sub = this.client.subscribe(topic, (msg: IMessage) => this.dispatch(topic, msg.body))
        this.stompSubs.set(topic, sub)
      }
    }
    this.handlers.get(topic)!.add(handler)

    return () => {
      const set = this.handlers.get(topic)
      if (!set) return
      set.delete(handler)
      if (set.size === 0) {
        this.handlers.delete(topic)
        this.stompSubs.get(topic)?.unsubscribe()
        this.stompSubs.delete(topic)
      }
    }
  }

  send(destination: string, body: unknown) {
    const msg = { destination, body: JSON.stringify(body) }
    if (this.client?.connected) {
      this.client.publish(msg)
    } else {
      // Client not yet created or still connecting — queue and flush on connect
      this.pendingPublish.push(msg)
    }
  }

  disconnect() {
    this.client?.deactivate()
    this.client = null
    this.currentToken = null
    this.handlers.clear()
    this.stompSubs.clear()
    this.pendingPublish = []
  }
}

export const stompManager = new StompManager()
