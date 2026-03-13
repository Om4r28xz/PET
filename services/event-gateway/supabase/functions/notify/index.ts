// @ts-nocheck
// Supabase Edge Function: notify
// Deno runtime — receives events and broadcasts via Supabase Realtime Broadcast.
// No database table required.
//
// In production, deploy with: supabase functions deploy notify

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CHANNEL_NAME = 'pet-events'
const BROADCAST_EVENT = 'new_event'

serve(async (req: Request) => {
    try {
        const { type, payload, timestamp } = await req.json()

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Broadcast event to all connected clients via Realtime
        const channel = supabase.channel(CHANNEL_NAME)

        await new Promise<void>((resolve, reject) => {
            channel.subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    channel.send({
                        type: 'broadcast',
                        event: BROADCAST_EVENT,
                        payload: {
                            id: `evt-${Date.now()}`,
                            type,
                            title: payload?.title || type,
                            message: payload?.message || '',
                            timestamp: timestamp || new Date().toISOString(),
                            ...payload,
                        },
                    }).then(() => resolve())
                        .catch(reject)
                }
            })
        })

        // Cleanup
        await supabase.removeChannel(channel)

        // Check for upcoming vaccine/deworming due dates
        if (type === 'vaccine_created' || type === 'deworming_created') {
            const dueDate = new Date(payload.date)
            const now = new Date()
            const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

            if (diffHours > 0 && diffHours <= 48) {
                const reminderChannel = supabase.channel(CHANNEL_NAME)
                await new Promise<void>((resolve) => {
                    reminderChannel.subscribe((status: string) => {
                        if (status === 'SUBSCRIBED') {
                            reminderChannel.send({
                                type: 'broadcast',
                                event: BROADCAST_EVENT,
                                payload: {
                                    id: `reminder-${Date.now()}`,
                                    type: 'reminder',
                                    title: `${type.includes('vaccine') ? 'Vaccine' : 'Deworming'} Due Soon`,
                                    message: `${payload.name || payload.product} is due within 48 hours`,
                                    timestamp: new Date().toISOString(),
                                },
                            }).then(() => resolve())
                        }
                    })
                })
                await supabase.removeChannel(reminderChannel)
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
