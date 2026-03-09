-- ============================================
-- Supabase Schema for Medical Ledger Service
-- Run this in Supabase SQL Editor to create tables.
-- ============================================

CREATE TABLE IF NOT EXISTS vaccines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    veterinarian TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deworming (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product TEXT NOT NULL,
    date DATE NOT NULL,
    weight_at_time TEXT DEFAULT '',
    next_due DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vet_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reason TEXT NOT NULL,
    date DATE NOT NULL,
    veterinarian TEXT DEFAULT '',
    diagnosis TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);
