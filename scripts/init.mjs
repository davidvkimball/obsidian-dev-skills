#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The package root is one level up from scripts/
const packageRoot = path.join(__dirname, '..');

// Find the real project root where the package is being installed
function getProjectRoot() {
  // INIT_CWD is set by npm/pnpm/yarn to the directory where the command was run
  if (process.env.INIT_CWD) {
    return process.env.INIT_CWD;
  }

  // Fallback: traverse up from process.cwd() to find the first package.json 
  // that isn't the one in this package
  let current = process.cwd();
  while (current !== path.parse(current).root) {
    const pkgPath = path.join(current, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name !== 'obsidian-dev-skills') {
          return current;
        }
      } catch (e) {}
    }
    current = path.dirname(current);
  }
  return process.cwd();
}

const projectRoot = getProjectRoot();

let agentDir = path.join(projectRoot, '.agent');
// If .agents exists but .agent doesn't, use .agents
if (!fs.existsSync(agentDir) && fs.existsSync(path.join(projectRoot, '.agents'))) {
  agentDir = path.join(projectRoot, '.agents');
}
const skillsDir = path.join(agentDir, 'skills');

const skillMappings = {
  'obsidian-dev': 'obsidian-dev-plugins',
  'obsidian-theme-dev': 'obsidian-dev-themes',
  'obsidian-ops': 'obsidian-ops',
  'obsidian-ref': 'obsidian-ref'
};

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function init() {
  // Determine if we are running in the package's own directory (development)
  const isDevelopment = projectRoot === packageRoot || 
    (fs.existsSync(path.join(packageRoot, 'obsidian-dev-plugins')) && 
     !fs.existsSync(path.join(projectRoot, 'node_modules', 'obsidian-dev-skills')));

  if (isDevelopment && !process.env.FORCE_INIT) {
    console.log('🛠️ Development mode detected (or forced skip), skipping initialization.');
    return;
  }

  console.log(`🚀 Initializing Obsidian Dev Skills in: ${projectRoot}`);
  try {
    // Create .agent/skills directory if it doesn't exist
    if (!fs.existsSync(skillsDir)) {
      console.log(`📁 Creating directory: ${skillsDir}`);
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    for (const [targetName, sourceName] of Object.entries(skillMappings)) {
      const sourcePath = path.join(packageRoot, sourceName);
      const targetPath = path.join(skillsDir, targetName);

      if (fs.existsSync(sourcePath)) {
        console.log(`✨ Copying skill: ${targetName}...`);
        // Remove existing if it exists to ensure fresh copy
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
        copyRecursiveSync(sourcePath, targetPath);
      } else {
        console.warn(`⚠️ Warning: Source skill not found at ${sourcePath}`);
      }
    }

    // Update or create sync-status.json
    const syncStatusPath = path.join(agentDir, 'sync-status.json');
    const today = new Date().toISOString().split('T')[0];
    
    let syncStatus = {
      lastFullSync: today,
      lastSyncSource: 'obsidian-dev-skills initialization'
    };

    if (fs.existsSync(syncStatusPath)) {
      try {
        const existingStatus = JSON.parse(fs.readFileSync(syncStatusPath, 'utf8'));
        syncStatus = { ...existingStatus, ...syncStatus };
      } catch (e) {
        // Ignore JSON parse errors and overwrite
      }
    }

    fs.writeFileSync(syncStatusPath, JSON.stringify(syncStatus, null, 2), 'utf8');
    console.log('✅ Updated .agent/sync-status.json');

    console.log('\n🎉 Successfully installed Obsidian Dev Skills!');
    console.log('Your AI agent now has access to specialized Obsidian development knowledge.');
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  }
}

init();
