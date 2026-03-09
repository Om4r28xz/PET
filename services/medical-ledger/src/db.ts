/**
 * Supabase client for Medical Ledger Service.
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment variables.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
    'Copy .env.example to .env and fill in your Supabase credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
