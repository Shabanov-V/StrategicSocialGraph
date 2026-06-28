import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guards against the D3Graph regression: components referenced legacy CSS vars
// (--medium-gray etc.) that token cleanup deleted, so SVG strokes/fills silently
// vanished. The old hex grep only scanned *.module.css; this scans every source
// file for var(--…) and fails if the name isn't defined in tokens.css.

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '..');
const tokensCss = readFileSync(join(here, 'tokens.css'), 'utf8');

const definedTokens = new Set(
  [...tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1])
);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(jsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('design tokens', () => {
  it('every var(--…) reference resolves to a token defined in tokens.css', () => {
    const offenders = [];
    for (const file of walk(srcRoot)) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
        const name = m[1];
        if (!definedTokens.has(name)) {
          offenders.push(`${file.replace(srcRoot, 'src')}: ${name}`);
        }
      }
    }
    expect(offenders, `undefined CSS vars:\n${offenders.join('\n')}`).toEqual([]);
  });
});
