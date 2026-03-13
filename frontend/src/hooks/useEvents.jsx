import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { API } from '../lib/api'

const EventsContext = createContext(null)

export function EventsProvider({ children }) {
    const [events, setEvents] = useState([])
    const [hasNewEvent, setHasNewEvent] = useState(false)

    const addEvent = useCallback((event) => {
        setEvents((prev) => {
            // Check for duplicates
            if (prev.some(e => e.id === event.id)) return prev;
            return [event, ...prev].slice(0, 50);
        })
        
        // Don't show toast for initial connection
        if (event.type !== 'connected') {
            setHasNewEvent(true)
            setTimeout(() => setHasNewEvent(false), 3000)
        }
    }, [])

    const clearNewFlag = useCallback(() => {
        setHasNewEvent(false)
    }, [])

    useEffect(() => {
        // Connect to our hand-made Event Gateway Server-Sent Events stream
        // In local development, Vite proxies /api/events to http://localhost:3002
        const sseUrl = '/api/events/stream';
        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
            try {
                const parsedEvent = JSON.parse(event.data);
                addEvent({
                    id: parsedEvent.id,
                    type: parsedEvent.type,
                    title: parsedEvent.payload?.title || parsedEvent.type || 'Event',
                    message: parsedEvent.payload?.message || '',
                    timestamp: parsedEvent.timestamp || new Date().toISOString(),
                });
            } catch (err) {
                console.error('[Events] Failed to parse event data:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('[Events] EventSource failed:', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        }
    }, [addEvent])

    return (
        <EventsContext.Provider value={{ events, hasNewEvent, addEvent, clearNewFlag }}>
            {children}
        </EventsContext.Provider>
    )
}

export function useEvents() {
    const ctx = useContext(EventsContext)
    if (!ctx) throw new Error('useEvents must be used within EventsProvider')
    return ctx
}

/**
 * Publish an event via our handmade Event Gateway API instead of Supabase Realtime.
 */
export async function publishEvent(type, payload) {
    try {
        const response = await fetch('/api/events/publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                payload: {
                   ...payload,
                   title: payload.title || type,
                   message: payload.message || '',
                },
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error('[Events] Broadcast HTTP error:', response.status);
        }
    } catch (err) {
        console.error('[Events] Broadcast fetch error:', err)
    }
}
