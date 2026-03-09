// @ts-nocheck
// Supabase Edge Function: notify
// Deno runtime — receives events from Medical Ledger and broadcasts via Supabase Realtime.
// 
// In production, deploy with: supabase functions deploy notify
// Locally, the Event Gateway service (services/event-gateway) simulates this behavior.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
    try {
        const { type, payload, timestamp } = await req.json()

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Insert event into the events table (triggers Realtime broadcast)
        const { error } = await supabase.from('events').insert({
            type,
            payload,
            timestamp: timestamp || new Date().toISOString(),
        })

        if (error) throw error

        // Check for upcoming vaccine/deworming due dates
        if (type === 'vaccine_created' || type === 'deworming_created') {
            const dueDate = new Date(payload.date)
            const now = new Date()
            const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

            if (diffHours > 0 && diffHours <= 48) {
                await supabase.from('events').insert({
                    type: 'reminder',
                    payload: {
                        title: `${type.includes('vaccine') ? 'Vaccine' : 'Deworming'} Due Soon`,
                        message: `${payload.name || payload.product} is due within 48 hours`,
                    },
                    timestamp: new Date().toISOString(),
                })
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
