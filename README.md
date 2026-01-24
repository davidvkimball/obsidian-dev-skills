# Obsidian Development Skills

This repository contains centralized AI agent skills for Obsidian plugin and theme development. It provides a single source of truth for development guidance, patterns, and best practices.

## Repository Structure

```
obsidian-dev-skills/
├── obsidian-dev/             # Plugin development skills
├── obsidian-theme-dev/       # Theme development skills
├── obsidian-ops/             # Operations & workflows
└── obsidian-ref/             # Technical references
```

## Installation & Usage

This package can be used as a development dependency in your Obsidian project.

### 1. Install to your project
```bash
# Using pnpm (Recommended)
pnpm add -D obsidian-dev-skills

# Using npm
npm install --save-dev obsidian-dev-skills

# Using yarn
yarn add -D obsidian-dev-skills
```

### 2. Initialize localized skills
Run the initialization script to seed the `.agent/skills/` folder. This also creates a project-specific skill template if one is missing.

```bash
# Using pnpm (Standard entry point)
pnpm obsidian-dev-skills

# Using npx (Universal entry point)
npx obsidian-dev-skills

# Manual execution
node node_modules/obsidian-dev-skills/scripts/init.mjs
```

### 3. Sync AI Agents
Ensure `AGENTS.md` is aligned with the localized skills.

```bash
npx openskills sync
```

## Skills Overview

### obsidian-dev
- TypeScript/JavaScript development patterns
- Obsidian API usage
- Plugin lifecycle management
- Command and settings implementation

### obsidian-theme-dev
- CSS/SCSS development patterns
- Obsidian CSS variables
- Responsive design
- Dark/light mode support

### obsidian-ops
- Build and release workflows
- Version management
- Sync procedures
- Testing and quality assurance

### obsidian-ref
- API documentation
- Manifest requirements
- File formats
- UI/UX guidelines

## Project-Specific Skills

Each project should also have a `project/` skill in `.agent/skills/project/` that contains:
- Project-specific architecture details
- Unique conventions and patterns
- Maintenance tasks
- Local workflow documentation

## Maintenance

### Updating Skills

When skills are updated in this repository, all linked projects automatically get the updates. No manual sync required.

### Tracking Sync Status

Each project maintains its own `sync-status.json` file to track when reference materials were last updated.

## Compatibility  
  
- **AI Agents**: Compatible with any AI agent supporting the Open Cognitive Skills (OCS) Specification  
- **IDEs**: Works across all development environments (VS Code, Cursor, JetBrains IDEs, etc.)  
- **Specification**: Works with the [OpenSkills](https://github.com/numman-ali/openskills) AGENTS.md format

## Contributing

Skills are maintained centrally to ensure consistency across all Obsidian projects. Updates should be made here and will automatically propagate to all linked projects.
