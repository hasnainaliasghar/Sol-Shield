/**
 * config.js — Loads and exports game balance values from balance.json.
 * All tunable numbers live in public/data/balance.json, never hardcoded.
 */

let _config = null;

/**
 * Load config from balance.json. Call once at startup.
 * @returns {Promise<object>} The balance config object.
 */
export async function loadConfig() {
  if (_config) return _config;
  const res = await fetch('/data/balance.json');
  if (!res.ok) throw new Error('Failed to load balance.json');
  _config = await res.json();
  return _config;
}

/**
 * Get config synchronously (must have called loadConfig first).
 */
export function getConfig() {
  if (!_config) throw new Error('Config not loaded yet. Call loadConfig() first.');
  return _config;
}

/**
 * For testing: set config directly.
 */
export function setConfig(cfg) {
  _config = cfg;
}

