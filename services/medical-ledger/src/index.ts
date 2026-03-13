/**
 * Medical Ledger Service
 * Node.js + TypeScript microservice for managing vaccination records,
 * deworming schedules, and veterinary visit history.
 *
 * Uses Supabase (PostgreSQL) as the data layer.
 */

import express from 'express';
import cors from 'cors';
import { supabase } from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// ── Health Check ──

app.get('/', (_req, res) => {
    res.json({ service: 'medical-ledger', version: '1.0.0', status: 'healthy' });
});

app.get('/api/medical/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// ════════════════════════════════════════
// VACCINES
// ════════════════════════════════════════

app.get('/api/medical/vaccines', async (req, res) => {
    const userId = req.query.user_id as string;
    let query = supabase.from('vaccines').select('*').order('date', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/medical/vaccines/next', async (_req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('vaccines')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || {});
});

app.post('/api/medical/vaccines', async (req, res) => {
    const { name, date, veterinarian = '', notes = '', user_id = null } = req.body;
    if (!name || !date) {
        return res.status(400).json({ error: 'name and date are required' });
    }

    const { data, error } = await supabase
        .from('vaccines')
        .insert({ name, date, veterinarian, notes, user_id })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data);
});

app.delete('/api/medical/vaccines/:id', async (req, res) => {
    const { id } = req.params;
    const { error, count } = await supabase
        .from('vaccines')
        .delete({ count: 'exact' })
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    if (count === 0) return res.status(404).json({ error: 'Not found' });

    const time = new Date().toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });
    publishEvent('vaccine_deleted', {
        title: 'Vacuna eliminada',
        message: `Se borró el registro de la vacuna a las ${time}`
    });
    res.json({ deleted: true });
});

// ════════════════════════════════════════
// DEWORMING
// ════════════════════════════════════════

app.get('/api/medical/deworming', async (req, res) => {
    const userId = req.query.user_id as string;
    let query = supabase.from('deworming').select('*').order('date', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/medical/deworming', async (req, res) => {
    const { product, date, weight_at_time = '', next_due = '', user_id = null } = req.body;
    if (!product || !date) {
        return res.status(400).json({ error: 'product and date are required' });
    }

    const { data, error } = await supabase
        .from('deworming')
        .insert({ product, date, weight_at_time, next_due: next_due || null, user_id })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data);
});

app.delete('/api/medical/deworming/:id', async (req, res) => {
    const { id } = req.params;
    const { error, count } = await supabase
        .from('deworming')
        .delete({ count: 'exact' })
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    if (count === 0) return res.status(404).json({ error: 'Not found' });

    const time = new Date().toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });
    publishEvent('deworming_deleted', {
        title: 'Desparasitación eliminada',
        message: `Se borró el registro de desparasitación a las ${time}`
    });
    res.json({ deleted: true });
});

// ════════════════════════════════════════
// VET VISITS
// ════════════════════════════════════════

app.get('/api/medical/visits', async (req, res) => {
    const userId = req.query.user_id as string;
    let query = supabase.from('vet_visits').select('*').order('date', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/medical/visits', async (req, res) => {
    const { reason, date, veterinarian = '', diagnosis = '', notes = '', user_id = null } = req.body;
    if (!reason || !date) {
        return res.status(400).json({ error: 'reason and date are required' });
    }

    const { data, error } = await supabase
        .from('vet_visits')
        .insert({ reason, date, veterinarian, diagnosis, notes, user_id })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data);
});

app.delete('/api/medical/visits/:id', async (req, res) => {
    const { id } = req.params;
    const { error, count } = await supabase
        .from('vet_visits')
        .delete({ count: 'exact' })
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    if (count === 0) return res.status(404).json({ error: 'Not found' });

    const time = new Date().toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });
    publishEvent('visit_deleted', {
        title: 'Visita eliminada',
        message: `Se borró el registro de visita veterinaria a las ${time}`
    });
    res.json({ deleted: true });
});

// ════════════════════════════════════════
// EVENT PUBLISHING (via Supabase Realtime Broadcast)
// ════════════════════════════════════════

async function publishEvent(type: string, payload: Record<string, unknown>) {
    try {
        const eventGatewayUrl = process.env.EVENT_GATEWAY_URL || 'http://localhost:3002';
        const response = await fetch(`${eventGatewayUrl}/api/events/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                payload: {
                    title: typeof payload.title === 'string' ? payload.title : type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    message: typeof payload.message === 'string' ? payload.message : JSON.stringify(payload),
                    timestamp: new Date().toISOString(),
                    ...payload,
                }
            }),
        });
        
        if (!response.ok) {
            console.error(`[Event Gateway] Failed to broadcast event HTTP status: ${response.status}`);
        }
    } catch (err) {
        console.error(`[Event Gateway] Failed to broadcast event: ${type}`, err);
    }
}

// ── Export app for Vercel serverless ──
export default app;

// ── Start Server (local dev only) ──
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🏥 Medical Ledger Service running on http://localhost:${PORT}`);
        console.log(`   Database: Supabase (PostgreSQL)`);
    });
}
