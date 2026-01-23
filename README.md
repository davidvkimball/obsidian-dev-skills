# Obsidian Development Skills

This repository contains centralized AI agent skills for Obsidian plugin and theme development. It provides a single source of truth for development guidance, patterns, and best practices.

## Repository Structure

```
obsidian-dev-skills/
├── obsidian-dev-plugins/     # Plugin development skills
├── obsidian-dev-themes/      # Theme development skills
├── obsidian-ops/            # Operations & workflows
└── obsidian-ref/            # Technical references
```

## Getting Started

### For Developers

This repository is automatically set up by the `setup-ref-links` script in the template projects.

### For Users

This repository is automatically managed by the template projects. Simply run the `setup-ref-links` script in your template project to get started.

### For Developers

The `setup-ref-links` script clones this repository to your `.ref` folder and creates the necessary symlinks.

## Skills Overview

### obsidian-dev-plugins
- TypeScript/JavaScript development patterns
- Obsidian API usage
- Plugin lifecycle management
- Command and settings implementation

### obsidian-dev-themes
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
- **Specification**: Open Cognitive Skills (OCS) - [https://github.com/AI-CAMEL/Skills-Specification](https://github.com/AI-CAMEL/Skills-Specification)

## Contributing

Skills are maintained centrally to ensure consistency across all Obsidian projects. Updates should be made here and will automatically propagate to all linked projects.