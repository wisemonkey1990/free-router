import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Parses a single `.env` file into process.env without adding a dependency.
// A value already present in the environment always wins, so real environment
// variables (and Docker's env_file) take precedence over the file on disk.
export function loadEnvFile(file) {
  if (!file || !fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value || process.env[match[1]]) continue;
    process.env[match[1]] = value;
  }
}

// The two files the router and its CLI both read, in precedence order: the
// project `.env` first, then a shared `~/.hermes/.env` for keys kept there.
export function defaultEnvFiles(here) {
  return [path.join(here, '.env'), path.join(os.homedir(), '.hermes', '.env')];
}

// Loads every default env file for a given project root.
export function loadProjectEnv(here) {
  for (const file of defaultEnvFiles(here)) loadEnvFile(file);
}
