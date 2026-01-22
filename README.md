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

### For New Projects

1. **Clone the sample templates:**
   ```bash
   # For plugins
   git clone https://github.com/davidvkimball/obsidian-sample-plugin-plus.git my-plugin
   cd my-plugin

   # For themes
   git clone https://github.com/davidvkimball/obsidian-sample-theme-plus.git my-theme
   cd my-theme
   ```

2. **Clone this skills repository as a sibling:**
   ```bash
   cd ..
   git clone https://github.com/davidvkimball/obsidian-dev-skills.git obsidian-dev-skills
   cd my-plugin  # or my-theme
   ```

3. **Set up skills symlinks:**
   ```bash
   # PowerShell (Windows)
   .\scripts\setup-skills.ps1

   # Bash (macOS/Linux)
   bash scripts/setup-skills.sh
   ```

### For Existing Projects

If you have an existing Obsidian plugin/theme project:

1. Clone this repository as a sibling directory
2. Run the appropriate setup script from your sample template
3. Or manually create symlinks following the pattern in the setup scripts

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

- **Cursor**: Primary supported AI agent
- **Open Cognitive Skills (OCS) Specification**: [https://github.com/AI-CAMEL/Skills-Specification](https://github.com/AI-CAMEL/Skills-Specification)

## Contributing

Skills are maintained centrally to ensure consistency across all Obsidian projects. Updates should be made here and will automatically propagate to all linked projects.