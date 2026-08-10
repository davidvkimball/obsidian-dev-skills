/**
 * Fleet audit: check every maintained repo for the config drift that the
 * Obsidian community scorecard reports but a local `pnpm lint` does not.
 *
 * Read-only. It never edits, commits, or releases anything.
 *
 * Usage:
 *   node scripts/fleet-audit.mjs            audit plugins, themes and templates
 *   node scripts/fleet-audit.mjs --probe    also run the TypeScript lib probe
 *   node scripts/fleet-audit.mjs --json     machine-readable output
 *
 * The --probe pass compiles each repo with `types: []` and counts TS2550
 * errors. That isolates lib-version failures. Ignore TS2591/TS2307 from a
 * probe run: those come from dropping @types/node and are artifacts of the
 * probe itself, not real findings.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fleet = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fleet.json'), 'utf8'));

const args = process.argv.slice(2);
const doProbe = args.includes('--probe');
const asJson = args.includes('--json');

/** Libs that predate Object.values/entries (ES2017) and Array.flat (ES2019). */
const STALE_LIBS = new Set(['es5', 'es6', 'es2015', 'es7', 'es2016']);

/** Strip comments so tsconfig files with // notes still parse. */
function readJsonc(file) {
	const raw = fs.readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '');
	return JSON.parse(raw);
}

function checkTsconfigLib(repo) {
	const file = path.join(repo, 'tsconfig.json');
	if (!fs.existsSync(file)) return { skip: true };
	let lib;
	try {
		lib = readJsonc(file).compilerOptions?.lib;
	} catch {
		return { ok: false, detail: 'tsconfig.json could not be parsed' };
	}
	if (!Array.isArray(lib)) return { ok: false, detail: 'no lib declared' };
	const nonDom = lib.filter((l) => !l.toLowerCase().startsWith('dom'));
	const stale = nonDom.length > 0 && nonDom.every((l) => STALE_LIBS.has(l.toLowerCase()));
	return stale
		? { ok: false, detail: `lib stops at ES2016 (${lib.join(', ')})` }
		: { ok: true, detail: lib.join(', ') };
}

function checkLintPluginVersion(repo) {
	const file = path.join(repo, 'package.json');
	if (!fs.existsSync(file)) return { skip: true };
	const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
	const spec = pkg.devDependencies?.['eslint-plugin-obsidianmd'];
	if (!spec) return { skip: true };
	const want = fleet.expected.eslintPluginObsidianmd;
	const clean = spec.replace(/^[\^~]/, '');
	return clean === want
		? { ok: true, detail: spec }
		: { ok: false, detail: `${spec}, expected ${want}` };
}

function checkEslintConfigPattern(repo) {
	const file = path.join(repo, 'eslint.config.mjs');
	if (!fs.existsSync(file)) return { skip: true };
	const src = fs.readFileSync(file, 'utf8');
	// The broken form maps `files` onto every recommended config object,
	// including the one that only registers the plugin. On 0.4.1 that stops
	// ESLint from starting at all.
	const broken = /configs\.recommended\.map\(\s*\(config\)\s*=>\s*\(\{/.test(src);
	return broken
		? { ok: false, detail: 'maps files onto the plugin-registration object' }
		: { ok: true, detail: 'ok' };
}

function checkPnpmOverridesLocation(repo) {
	const file = path.join(repo, 'package.json');
	if (!fs.existsSync(file)) return { skip: true };
	const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
	if (!pkg.pnpm?.overrides) return { ok: true, detail: 'ok' };
	return { ok: false, detail: 'overrides still in package.json (pnpm ignores it)' };
}

function probeLibErrors(repo) {
	const probe = path.join(repo, 'tsconfig.probe.json');
	try {
		fs.writeFileSync(probe, '{ "extends": "./tsconfig.json", "compilerOptions": { "types": [] } }');
		let out = '';
		try {
			out = execSync('pnpm exec tsc -p tsconfig.probe.json --noEmit --skipLibCheck', {
				cwd: repo,
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'pipe'],
			});
		} catch (err) {
			out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
		}
		// TS2550 only. TS2591/TS2307 come from dropping @types/node in the probe.
		return (out.match(/error TS2550/g) ?? []).length;
	} catch {
		return null;
	} finally {
		if (fs.existsSync(probe)) fs.unlinkSync(probe);
	}
}

const CHECKS = [
	['tsconfig lib', checkTsconfigLib],
	['obsidianmd ver', checkLintPluginVersion],
	['eslint config', checkEslintConfigPattern],
	['pnpm overrides', checkPnpmOverridesLocation],
];

const targets = [
	...fleet.plugins.map((n) => ({ name: n, kind: 'plugin' })),
	...fleet.themes.map((n) => ({ name: n, kind: 'theme' })),
	...fleet.templates.map((n) => ({ name: n, kind: 'template' })),
];

const results = [];
for (const { name, kind } of targets) {
	const repo = path.join(fleet.root, name);
	if (!fs.existsSync(repo)) {
		results.push({ name, kind, missing: true, issues: ['repo not found on disk'] });
		continue;
	}
	const issues = [];
	const detail = {};
	for (const [label, fn] of CHECKS) {
		const r = fn(repo);
		if (r.skip) continue;
		detail[label] = r.detail;
		if (!r.ok) issues.push(`${label}: ${r.detail}`);
	}
	const entry = { name, kind, issues, detail };
	if (doProbe && fs.existsSync(path.join(repo, 'tsconfig.json'))) {
		const n = probeLibErrors(repo);
		entry.libProbeErrors = n;
		if (n) issues.push(`probe: ${n} TS2550 lib errors`);
	}
	results.push(entry);
}

if (asJson) {
	console.log(JSON.stringify({ results, unclassified: fleet.unclassified.repos }, null, 2));
} else {
	const clean = results.filter((r) => !r.missing && r.issues.length === 0);
	const dirty = results.filter((r) => r.missing || r.issues.length > 0);

	console.log(`\nFleet audit: ${results.length} repos (${clean.length} clean, ${dirty.length} need attention)\n`);
	for (const r of dirty) {
		console.log(`  ${r.name} [${r.kind}]`);
		for (const i of r.issues) console.log(`      - ${i}`);
	}
	if (dirty.length === 0) console.log('  Everything matches the expected configuration.\n');

	if (fleet.unclassified.repos.length > 0) {
		console.log(`\nUnclassified (triage these into fleet.json):`);
		for (const n of fleet.unclassified.repos) console.log(`  - ${n}`);
	}
	console.log('');
}

process.exit(results.some((r) => r.missing || r.issues.length > 0) ? 1 : 0);
