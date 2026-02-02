#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The package root is one level up from scripts/
const packageRoot = path.join(__dirname, '..');

/**
 * Compares two paths for equality, handling platform-specific differences.
 */
function arePathsEqual(path1, path2) {
  if (!path1 || !path2) return false;
  const norm1 = path.normalize(path1).replace(/[\\/]$/, '');
  const norm2 = path.normalize(path2).replace(/[\\/]$/, '');

  if (process.platform === 'win32') {
    return norm1.toLowerCase() === norm2.toLowerCase();
  }
  return norm1 === norm2;
}

// Find the real project root where the package is being installed
// Find the real project root where the package is being installed
function getProjectRoot() {
  // We want to find the root of the project, which is the directory containing 
  // the first package.json that isn't for 'obsidian-dev-skills' (unless it's the dev repo).
  // We start from INIT_CWD (where the command was run) or process.cwd() as fallback.
  const initial = process.env.INIT_CWD || process.cwd();
  let current = initial;

  while (current !== path.parse(current).root) {
    const pkgPath = path.join(current, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name !== 'obsidian-dev-skills') {
          return current;
        }
        // If we found 'obsidian-dev-skills', check if we are in node_modules.
        // If we are NOT in node_modules, this is likely the development repository.
        if (!current.toLowerCase().includes('node_modules')) {
          return current;
        }
      } catch (e) { }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  // Fallback to the initial directory if no project root found
  return initial;
}

const projectRoot = getProjectRoot();

let agentDir = path.join(projectRoot, '.agent');
// If .agents exists but .agent doesn't, use .agents
if (!fs.existsSync(agentDir) && fs.existsSync(path.join(projectRoot, '.agents'))) {
  agentDir = path.join(projectRoot, '.agents');
}
const skillsDir = path.join(agentDir, 'skills');

const skillMappings = {
  'obsidian-dev': 'obsidian-dev',
  'obsidian-theme-dev': 'obsidian-theme-dev',
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

/**
 * Detects if the project is an Obsidian plugin, theme, or both.
 * @returns {'plugin' | 'theme' | 'both'}
 */
function detectProjectType(root) {
  const manifestPath = path.join(root, 'manifest.json');
  const themeCssPath = path.join(root, 'theme.css');

  let isPlugin = false;
  let isTheme = false;

  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.id) {
        isPlugin = true;
      } else {
        // Obsidian themes also have a manifest.json but typically no 'id' field
        isTheme = true;
      }
    } catch (e) {
      console.warn(`⚠️ Warning: Failed to parse manifest.json at ${manifestPath}`);
    }
  }

  if (fs.existsSync(themeCssPath)) {
    isTheme = true;
  }

  // If detected both, return 'both'
  if (isPlugin && isTheme) {
    return 'both';
  }

  // If detected neither, return 'both' (fallback)
  if (!isPlugin && !isTheme) {
    return 'both';
  }

  return isPlugin ? 'plugin' : 'theme';
}

/**
 * Asks the user to select a project type if it's ambiguous.
 * @returns {Promise<'plugin' | 'theme' | 'both'>}
 */
function askProjectType() {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve('both');
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n❓ The project type is not immediately clear.');
    console.log('Is this an Obsidian plugin project, a theme project, or both?');
    console.log('Choices: [p]lugin, [t]heme, [b]oth (default)');

    const handleAnswer = (answer) => {
      const cleanAnswer = answer.trim().toLowerCase();
      if (cleanAnswer === 'p' || cleanAnswer === 'plugin') {
        rl.close();
        resolve('plugin');
      } else if (cleanAnswer === 't' || cleanAnswer === 'theme') {
        rl.close();
        resolve('theme');
      } else if (cleanAnswer === 'b' || cleanAnswer === 'both' || cleanAnswer === '') {
        rl.close();
        resolve('both');
      } else {
        console.log('Invalid choice. Please enter p, t, or b.');
        rl.question('> ', handleAnswer);
      }
    };

    rl.question('> ', handleAnswer);
  });
}

/**
 * Updates AGENTS.md in the project root to include the installed skills in the openskills format.
 */
function updateAgentsMarkdown(root, installedSkills) {
  const agentsPath = path.join(root, 'AGENTS.md');
  const agentDirName = path.basename(agentDir); // .agent or .agents

  const skillDetails = {
    'obsidian-dev': 'Core development patterns for Obsidian plugins. Load when editing src/main.ts, implementing features, handling API calls, or managing plugin lifecycle.',
    'obsidian-theme-dev': 'CSS/SCSS development patterns for Obsidian themes. Load when working with theme.css, SCSS variables, or CSS selectors.',
    'obsidian-ops': 'Operations, syncing, versioning, and release management for Obsidian projects. Load when running builds, syncing references, bumping versions, or preparing for release.',
    'obsidian-ref': 'Technical references, manifest rules, file formats, and UX guidelines for Obsidian. Load when checking API details, manifest requirements, or UI/UX standards.',
    'project': 'Project-specific architecture, maintenance tasks, and unique conventions for this repository. Load when performing project-wide maintenance or working with the core architecture.'
  };

  const skillTags = installedSkills
    .map(skill => {
      const description = skillDetails[skill] || 'Specialized skill for this project.';
      return `<skill>
<name>${skill}</name>
<description>${description}</description>
<location>project</location>
</skill>`;
    })
    .join('\n\n');

  const xmlSection = `<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Read skill: \`cat ./${agentDirName}/skills/<skill-name>/SKILL.md\`
- The skill content will load with detailed instructions on how to complete the task
- Skills are stored locally in ./${agentDirName}/skills/ directory

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

${skillTags}

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>`;

  let content = '';
  if (fs.existsSync(agentsPath)) {
    content = fs.readFileSync(agentsPath, 'utf8');

    const startMarker = '<skills_system';
    const endMarker = '</skills_system>';
    const htmlStartMarker = '<!-- SKILLS_TABLE_START -->';
    const htmlEndMarker = '<!-- SKILLS_TABLE_END -->';

    if (content.includes(startMarker)) {
      const regex = /<skills_system[^>]*>[\s\S]*?<\/skills_system>/;
      content = content.replace(regex, xmlSection);
    } else if (content.includes(htmlStartMarker)) {
      // Logic parity with openskills: replace content between HTML markers if XML tag is missing
      const innerContent = xmlSection.replace(/<skills_system[^>]*>|<\/skills_system>/g, '').trim();
      const regex = new RegExp(`${htmlStartMarker}[\\s\\S]*?${htmlEndMarker}`, 'g');
      content = content.replace(regex, `${htmlStartMarker}\n${innerContent}\n${htmlEndMarker}`);
    } else {
      content = content.trimEnd() + '\n\n' + xmlSection + '\n';
    }
  } else {
    content = '# AGENTS\n\nThis project uses specialized AI agent skills for development.\n\n' + xmlSection + '\n';
  }

  fs.writeFileSync(agentsPath, content, 'utf8');
  console.log('📝 Updated AGENTS.md (openskills format)');
}

/**
 * Ensures a project-specific skill exists, creating a template if it doesn't.
 */
function initializeProjectSkill(targetSkillsDir) {
  const projectSkillDir = path.join(targetSkillsDir, 'project');
  const projectSkillFile = path.join(projectSkillDir, 'SKILL.md');

  if (!fs.existsSync(projectSkillFile)) {
    console.log('📝 Initializing project-specific skill template...');
    if (!fs.existsSync(projectSkillDir)) {
      fs.mkdirSync(projectSkillDir, { recursive: true });
    }

    const template = `---
name: project
description: Project-specific architecture, maintenance tasks, and unique conventions. Load when performing project-wide maintenance or working with the core architecture.
---

# Project Context

This skill provides the unique context and architectural details for this repository.

## Purpose

To provide guidance on project-specific structures and tasks that differ from general Obsidian development patterns.

## When to Use

Load this skill when:
- Understanding the repository's unique architecture.
- Performing recurring maintenance tasks.
- Following project-specific coding conventions.

## Project Overview

<!-- 
TIP: Update this section with your project's high-level architecture.
Example:
- **Architecture**: Organized structure with main code in \`src/main.ts\` and settings in \`src/settings.ts\`.
- **Reference Management**: Uses a \`.ref\` folder with symlinks to centralized Obsidian repositories.
-->

- **Primary Stack**: [e.g., TypeScript, Svelte, Lucide icons]
- **Key Directories**: [e.g., src/, styles/, scripts/]

## Core Architecture

- [Detail how primary components interact here]

## Project-Specific Conventions

- **Naming**: [e.g., class names use PascalCase, private methods prefixed with _]
- **Patterns**: [e.g., use of custom stores, specific state management]

## Key Files

- \`manifest.json\`: Plugin/theme manifest
- \`package.json\`: Build scripts and dependencies

## Maintenance Tasks

- [e.g., npm run dev to start development server]
- [e.g., npm run version-bump to release new version]
`;
    fs.writeFileSync(projectSkillFile, template, 'utf8');
  }
}

async function init() {
  // Determine if we are running in the package's own directory (development)
  const isDevelopment = arePathsEqual(projectRoot, packageRoot);

  if (isDevelopment && !process.env.FORCE_INIT) {
    console.log('🛠️ Development mode detected: skipping initialization in the skills repository.');
    console.log('💡 To force initialization (e.g., for testing), run:');
    console.log('   $env:FORCE_INIT=1; pnpm obsidian-dev-skills  (PowerShell)');
    console.log('   FORCE_INIT=1 pnpm obsidian-dev-skills       (Bash/Zsh)');
    return;
  }

  console.log(`🚀 Initializing Obsidian Dev Skills in: ${projectRoot}`);
  try {
    let projectType = detectProjectType(projectRoot);

    if (projectType === 'both' && process.stdin.isTTY) {
      projectType = await askProjectType();
    }

    console.log(`🔍 Using project type: ${projectType}`);

    // Create .agent/skills directory if it doesn't exist
    if (!fs.existsSync(skillsDir)) {
      console.log(`📁 Creating directory: ${skillsDir}`);
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    for (const [targetName, sourceName] of Object.entries(skillMappings)) {
      // Filter based on project type
      if (projectType === 'plugin' && targetName === 'obsidian-theme-dev') {
        continue;
      }
      if (projectType === 'theme' && targetName === 'obsidian-dev') {
        continue;
      }

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

    // Ensure project-specific skill exists
    initializeProjectSkill(skillsDir);

    // Update AGENTS.md
    const installedSkills = Object.keys(skillMappings).filter(name => {
      if (projectType === 'plugin' && name === 'obsidian-theme-dev') return false;
      if (projectType === 'theme' && name === 'obsidian-dev') return false;
      return true;
    });
    installedSkills.push('project'); // Always include project skill
    updateAgentsMarkdown(projectRoot, installedSkills);

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
