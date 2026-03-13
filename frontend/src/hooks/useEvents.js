import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const CHANNEL_NAME = 'pet-events'
const BROADCAST_EVENT = 'new_event'

/**
 * Hook for real-time events via Supabase Realtime Broadcast.
 *
 * Uses Broadcast (no database table required):
 * - Subscribes to a channel and listens for broadcast messages.
 * - Any client can publish events that all other clients receive instantly.
 * - Falls back to simulated events if Supabase is not configured.
 */
export function useEvents() {
    const [events, setEvents] = useState([])
    const [hasNewEvent, setHasNewEvent] = useState(false)
    const channelRef = useRef(null)

    const addEvent = useCallback((event) => {
        setEvents((prev) => [event, ...prev].slice(0, 50))
        setHasNewEvent(true)
        setTimeout(() => setHasNewEvent(false), 3000)
    }, [])

    const clearNewFlag = useCallback(() => {
        setHasNewEvent(false)
    }, [])

    useEffect(() => {
        // ── If Supabase is not configured, fall back to simulated event ──
        if (!supabase) {
            return
        }

        // ── Subscribe to Broadcast channel ──
        const channel = supabase
            .channel(CHANNEL_NAME)
            .on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
                if (payload) {
                    addEvent({
                        id: payload.id || `evt-${Date.now()}`,
                        type: payload.type || 'info',
                        title: payload.title || payload.type || 'Event',
                        message: payload.message || '',
                        timestamp: payload.timestamp || new Date().toISOString(),
                    })
                }
            })
            .subscribe((status) => {
                // Subscribe silently without adding a feed notification
            })

        channelRef.current = channel

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [addEvent])

    return { events, hasNewEvent, addEvent, clearNewFlag }
}

/**
 * Publish an event via Supabase Realtime Broadcast.
 * All connected clients on the 'pet-events' channel will receive it instantly.
 * No database table required.
 */
export async function publishEvent(type, payload) {
    if (!supabase) return

    try {
        const channel = supabase.channel(CHANNEL_NAME)

        await channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                channel.send({
                    type: 'broadcast',
                    event: BROADCAST_EVENT,
                    payload: {
                        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        type,
                        title: payload.title || type,
                        message: payload.message || '',
                        timestamp: new Date().toISOString(),
                        ...payload,
                    },
                })

                // Cleanup: unsubscribe after sending
                setTimeout(() => supabase.removeChannel(channel), 500)
            }
        })
    } catch (err) {
        console.error('[Events] Broadcast error:', err)
    }
}
