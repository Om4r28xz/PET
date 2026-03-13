// @ts-nocheck
// Supabase Edge Function: check-schedule
// Deno runtime — scheduled cron function that checks for medical events due within 24h.
// Broadcasts reminders via Supabase Realtime (no database table required).
//
// Configure in Supabase dashboard:
//   Schedule: */30 * * * * (every 30 minutes)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const medicalServiceUrl = Deno.env.get('MEDICAL_SERVICE_URL') || 'http://localhost:3001'

const CHANNEL_NAME = 'pet-events'
const BROADCAST_EVENT = 'new_event'

serve(async (_req: Request) => {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Fetch upcoming vaccines from Medical Ledger
        const vaccineRes = await fetch(`${medicalServiceUrl}/api/medical/vaccines/next`)
        const vaccine = await vaccineRes.json()

        if (vaccine && vaccine.name && vaccine.date) {
            const dueDate = new Date(vaccine.date)
            const now = new Date()
            const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

            if (diffHours > 0 && diffHours <= 24) {
                const channel = supabase.channel(CHANNEL_NAME)
                await new Promise<void>((resolve) => {
                    channel.subscribe((status: string) => {
                        if (status === 'SUBSCRIBED') {
                            channel.send({
                                type: 'broadcast',
                                event: BROADCAST_EVENT,
                                payload: {
                                    id: `reminder-${Date.now()}`,
                                    type: 'reminder',
                                    title: 'Vaccine Due Tomorrow',
                                    message: `${vaccine.name} is due within 24 hours`,
                                    vaccine_id: vaccine.id,
                                    timestamp: new Date().toISOString(),
                                },
                            }).then(() => resolve())
                        }
                    })
                })
                await supabase.removeChannel(channel)
            }
        }

        return new Response(JSON.stringify({ checked: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
