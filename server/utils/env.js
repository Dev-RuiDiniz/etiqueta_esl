import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Loader simples de .env para manter o BFF sem dependência extra.
function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

export function loadDotEnv(files = ['.env', '.env.local']) {
  for (const file of files) {
    const filepath = resolve(process.cwd(), file);

    if (!existsSync(filepath)) {
      continue;
    }

    const content = readFileSync(filepath, 'utf8');

    for (const line of content.split(/\r?\n/u)) {
      const parsed = parseLine(line);

      if (!parsed) {
        continue;
      }

      if (typeof process.env[parsed.key] === 'undefined') {
        process.env[parsed.key] = parsed.value;
      }
    }
  }
}
