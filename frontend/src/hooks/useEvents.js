import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for Supabase Realtime events.
 * In production, this connects to Supabase Realtime channels.
 * For local development, it simulates events to demonstrate the UI.
 */
export function useEvents() {
    const [events, setEvents] = useState([])
    const [hasNewEvent, setHasNewEvent] = useState(false)

    const addEvent = useCallback((event) => {
        setEvents((prev) => [event, ...prev].slice(0, 20))
        setHasNewEvent(true)
        setTimeout(() => setHasNewEvent(false), 3000)
    }, [])

    const clearNewFlag = useCallback(() => {
        setHasNewEvent(false)
    }, [])

    // Simulate a welcome event on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            addEvent({
                id: 'welcome-1',
                type: 'info',
                title: 'System Connected',
                message: 'Real-time event gateway is active',
                timestamp: new Date().toISOString(),
            })
        }, 1500)
        return () => clearTimeout(timer)
    }, [addEvent])

    return { events, hasNewEvent, addEvent, clearNewFlag }
}
