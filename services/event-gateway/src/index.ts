/**
 * Real-Time Event Gateway Service
 * 
 * Acts as the system's communication hub using SSE (Server-Sent Events)
 * for local development and Supabase Realtime for production.
 * 
 * - Receives events from other microservices via POST
 * - Broadcasts events to connected frontend clients via SSE
 * - In production, this logic lives in Supabase Edge Functions
 *   and uses Supabase Realtime WebSockets for push delivery.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

app.use(cors());
app.use(express.json());

// ── In-memory event store & SSE clients ──

interface AppEvent {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    timestamp: string;
}

const eventHistory: AppEvent[] = [];
const sseClients: Set<express.Response> = new Set();

let eventCounter = 0;

// ── Health Check ──

app.get('/', (_req, res) => {
    res.json({
        service: 'event-gateway',
        version: '1.0.0',
        status: 'healthy',
        connectedClients: sseClients.size,
    });
});

app.get('/api/events/health', (_req, res) => {
    res.json({ status: 'ok', clients: sseClients.size });
});

// ════════════════════════════════════════
// SSE STREAM (replaces Supabase Realtime for local dev)
// ════════════════════════════════════════

app.get('/api/events/stream', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });

    // Send initial connection event
    const connectEvent: AppEvent = {
        id: `evt-${++eventCounter}`,
        type: 'connected',
        payload: { message: 'Event Gateway connected' },
        timestamp: new Date().toISOString(),
    };
    res.write(`data: ${JSON.stringify(connectEvent)}\n\n`);

    // Register client
    sseClients.add(res);
    console.log(`📡 Client connected (${sseClients.size} total)`);

    // Send heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
        console.log(`📡 Client disconnected (${sseClients.size} total)`);
    });
});

// ════════════════════════════════════════
// EVENT PUBLISHING (internal endpoint)
// ════════════════════════════════════════

app.post('/api/events/publish', (req, res) => {
    const { type, payload, timestamp } = req.body;

    if (!type) {
        return res.status(400).json({ error: 'type is required' });
    }

    const event: AppEvent = {
        id: `evt-${++eventCounter}`,
        type,
        payload: payload || {},
        timestamp: timestamp || new Date().toISOString(),
    };

    // Store in history (keep last 100)
    eventHistory.unshift(event);
    if (eventHistory.length > 100) eventHistory.pop();

    // Fan-out to all connected SSE clients
    const eventData = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
        try {
            client.write(eventData);
        } catch {
            sseClients.delete(client);
        }
    }

    console.log(`📢 Event published: ${type} → ${sseClients.size} clients`);
    res.status(201).json(event);
});

// ════════════════════════════════════════
// EVENT HISTORY
// ════════════════════════════════════════

app.get('/api/events/history', (_req, res) => {
    res.json(eventHistory);
});

// ── Schedule checker (simulates Supabase cron Edge Function) ──

function checkUpcomingEvents() {
    // In production, this is a Supabase scheduled Edge Function.
    // For local dev, it runs on a timer and checks the Medical Ledger.
    const medicalUrl = process.env.MEDICAL_SERVICE_URL || 'http://localhost:3001';

    fetch(`${medicalUrl}/api/medical/vaccines/next`)
        .then((r) => r.json())
        .then((vaccine: Record<string, unknown>) => {
            if (vaccine && vaccine.name && vaccine.date) {
                const dueDate = new Date(vaccine.date as string);
                const now = new Date();
                const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

                if (diffHours > 0 && diffHours <= 24) {
                    const reminderEvent: AppEvent = {
                        id: `evt-${++eventCounter}`,
                        type: 'reminder',
                        payload: {
                            title: 'Vaccine Due Tomorrow',
                            message: `${vaccine.name} is due within 24 hours`,
                            vaccineId: vaccine.id,
                        },
                        timestamp: new Date().toISOString(),
                    };

                    const eventData = `data: ${JSON.stringify(reminderEvent)}\n\n`;
                    for (const client of sseClients) {
                        try { client.write(eventData); } catch { sseClients.delete(client); }
                    }
                }
            }
        })
        .catch(() => {
            // Medical service may be offline
        });
}

// Check every 5 minutes
setInterval(checkUpcomingEvents, 5 * 60 * 1000);

// ── Start Server ──

app.listen(PORT, () => {
    console.log(`📡 Event Gateway running on http://localhost:${PORT}`);
    console.log(`   SSE stream: http://localhost:${PORT}/api/events/stream`);
});
