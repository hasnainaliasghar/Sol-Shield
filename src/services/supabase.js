/**
 * src/services/supabase.js — Optional anonymous leaderboard.
 * Only initializes if VITE_SUPABASE_* env vars are present.
 * Silent failure everywhere — game works without it.
 *
 * SQL to run in Supabase SQL Editor:
 *
 * create table if not exists public.runs (
 *   id            uuid primary key default gen_random_uuid(),
 *   created_at    timestamptz not null default now(),
 *   nickname      text not null check (char_length(nickname) between 3 and 24),
 *   mode          text not null check (mode in ('moon','mars')),
 *   storm_id      text not null check (char_length(storm_id) <= 40),
 *   storm_tier    int  not null check (storm_tier between 1 and 3),
 *   success       boolean not null,
 *   stars         int  not null check (stars between 0 and 3),
 *   final_dose    int  not null check (final_dose between 0 and 100),
 *   shield_at_storm int not null check (shield_at_storm between 0 and 100),
 *   asked_control boolean not null,
 *   fail_reason   text check (fail_reason in ('air','food','dose') or fail_reason is null)
 * );
 * alter table public.runs enable row level security;
 * create policy "anon can insert runs" on public.runs for insert to anon with check (true);
 * create policy "anon can read runs"   on public.runs for select to anon using (true);
 * create or replace view public.leaderboard as
 *   select nickname, mode, stars, final_dose, storm_tier, created_at
 *   from public.runs where success = true
 *   order by stars desc, final_dose asc, created_at desc limit 20;
 * grant select on public.leaderboard to anon;
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FEATURE_LB   = import.meta.env.VITE_FEATURE_LEADERBOARD !== 'false';

let _client = null;

async function getClient() {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_KEY || !FEATURE_LB) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    _client = createClient(SUPABASE_URL, SUPABASE_KEY);
    return _client;
  } catch {
    return null;
  }
}

/**
 * Save a completed run to Supabase. Silent failure.
 */
export async function saveRun(state, config, stars, nickname) {
  const sb = await getClient();
  if (!sb) return;

  const stormLog = state.log?.find(e => e.type === 'storm' && !e.isSecondSol);

  try {
    await sb.from('runs').insert({
      nickname,
      mode:          state.mode,
      storm_id:      state.storm?.eventId || 'unknown',
      storm_tier:    state.storm?.tier || 1,
      success:       state.outcome === 'success',
      stars,
      final_dose:    Math.round(state.dose),
      shield_at_storm: Math.round(stormLog?.shieldAtStorm || state.shield),
      asked_control: (state.askedControl?.length || 0) > 0,
      fail_reason:   state.outcome !== 'success' ? state.outcome.replace('fail-', '') : null,
    });
  } catch {
    // Silent — leaderboard is optional
  }
}

/**
 * Fetch the top-20 leaderboard. Returns [] on failure.
 */
export async function getLeaderboard() {
  const sb = await getClient();
  if (!sb) return [];
  try {
    const { data } = await sb.from('leaderboard').select('*');
    return data || [];
  } catch {
    return [];
  }
}

