# Theme Development Best Practices

## CSS Organization
- Group related styles together (Editor, UI, Sidebar, etc.)
- Use comments to separate major sections
- Keep specificity low for easy customization

## Obsidian CSS Variables
Always prefer Obsidian's built-in CSS variables over hardcoded values:

```css
/* Good */
.theme-dark {
  --my-accent: var(--interactive-accent);
  background-color: var(--background-primary);
  color: var(--text-normal);
}

/* Avoid */
.theme-dark {
  background-color: #2d2d30;
  color: #cccccc;
}
```

### Commonly Used Variables

These are officially documented and stable:

```css
/* Surface colors */
--background-primary        /* Main background */
--background-primary-alt    /* Surfaces on top of primary */
--background-secondary      /* Sidebar, secondary areas */
--background-secondary-alt  /* Surfaces on top of secondary */
--background-modifier-border /* Borders */
--background-modifier-hover /* Hovered elements */

/* Text colors */
--text-normal               /* Primary text */
--text-muted                /* Secondary/dimmed text */
--text-faint                /* Tertiary/very dim text */
--text-accent               /* Accent-colored text */

/* Interactive colors */
--interactive-accent        /* Links, buttons, highlights */
--interactive-accent-hover  /* Hover states */
--interactive-normal        /* Standard interactive bg */
--interactive-hover         /* Standard interactive hover */

/* Typography */
--font-text                 /* Body text font stack */
--font-monospace            /* Code font stack */
--font-interface            /* UI elements font stack */

/* Spacing (4px grid) */
--size-4-1                  /* 4px */
--size-4-2                  /* 8px */
--size-4-3                  /* 12px */
--size-4-4                  /* 16px */

/* Border radius */
--radius-s                  /* 4px - small */
--radius-m                  /* 8px - medium */
--radius-l                  /* 12px - large */
```

**Reference**: See the official [CSS variables documentation](https://docs.obsidian.md/Reference/CSS+variables/CSS+variables) for the complete list. Variables not in the official docs may change between Obsidian versions.

## Key Obsidian Selectors

Understanding Obsidian's DOM structure helps target elements correctly:

```css
/* Main workspace areas */
.workspace                    /* Root workspace container */
.workspace-leaf               /* Individual pane/tab */
.workspace-leaf-content       /* Content area of a pane */
.view-content                 /* View's main content area */

/* Sidebar */
.workspace-ribbon             /* Left ribbon (icon bar) */
.workspace-sidedock           /* Sidebars container */
.nav-files-container          /* File explorer */

/* Editor */
.cm-editor                    /* CodeMirror editor root */
.cm-content                   /* Editor content area */
.cm-line                      /* Individual line */
.markdown-preview-view        /* Reading view */
.markdown-source-view         /* Editing view */

/* Common UI */
.modal                        /* Modal dialogs */
.menu                         /* Context menus */
.suggestion-container         /* Autocomplete popups */
```

## Responsive Design

Use Obsidian's platform classes rather than just media queries:

```css
/* Mobile-first approach */
.my-component {
  width: 100%;
}

/* Desktop override - NOTE: there is no .is-desktop class */
body:not(.is-mobile) .my-component {
  width: 50%;
}

/* Mobile-specific */
.is-mobile .my-component {
  padding: var(--size-4-2);
}

/* Tablet vs phone */
.is-tablet .my-component {
  width: 80%;
}

/* Traditional media query (also valid) */
@media (min-width: 768px) {
  .my-component {
    width: 50%;
  }
}
```

See `mobile.md` in obsidian-ref for the full list of platform classes.

## Dark/Light Mode Support

Obsidian uses `.theme-dark` and `.theme-light` classes:

```css
/* Support both themes */
.theme-dark .my-element {
  background: var(--background-primary);
}

.theme-light .my-element {
  background: var(--background-secondary);
}

/* Or use CSS variables that auto-adapt */
.my-element {
  /* These variables already differ between themes */
  background: var(--background-primary);
  color: var(--text-normal);
}
```

## Working with Plugin Styles

If styling elements from plugins:
- Check if the plugin exposes CSS classes you can target
- Avoid `!important` - it prevents users from overriding with snippets (see `theme-coding-conventions.md` for when unavoidable)
- Document which plugins your theme specifically supports/styles

## Discovering CSS Variables

Obsidian exposes 400+ CSS variables. To find the right variable for a specific element:

1. Open **Developer Tools**: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
2. Go to **Sources → Page → top → obsidian.md → app.css**
3. Search for variables: `Ctrl+F` / `Cmd+F` and type `  --` (two spaces + double dash) to find definitions
4. To find what variable styles a specific element:
   - Click the inspect cursor icon (top-left of Dev Tools)
   - Click the element in Obsidian
   - Check the **Styles** tab to see applied CSS variables

Example: To find the ribbon background variable, search for `  --ribbon-` in app.css, or inspect the ribbon element directly.