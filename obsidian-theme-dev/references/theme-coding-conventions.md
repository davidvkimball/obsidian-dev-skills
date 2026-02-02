# Theme Coding Conventions

## CSS/SCSS Guidelines

### Naming Conventions

There's no enforced standard in the Obsidian theme community. Choose an approach that works for your theme:

**Option 1: BEM Methodology** (structured, scalable)
```css
.my-theme__header { }
.my-theme__header--dark { }
.my-theme__content { }
```

**Option 2: Simple Prefixed Classes** (common in many themes)
```css
.mytheme-header { }
.mytheme-header-dark { }
.mytheme-content { }
```

**Option 3: Unprefixed Classes** (simpler, but risk of conflicts)
```css
/* Some themes intentionally avoid prefixes to prevent other CSS from overriding */
.custom-header { }
```

**General guidelines:**
- Use lowercase with hyphens: `.my-component` (not `.myComponent`)
- Be consistent within your theme
- Consider prefixing custom CSS variables: `--my-theme-accent`

### Nesting Approaches

Different developers prefer different nesting styles. All are valid:

**Using `&` (SCSS parent selector)**
```scss
.my-component {
  &__header {
    color: var(--text-normal);
  }

  &--active {
    background: var(--interactive-accent);
  }
}
```

**Using `>` (direct child)**
```scss
.my-component {
  > .header {
    color: var(--text-normal);
  }
}
```

**Flat/No nesting (plain CSS)**
```css
.my-component { }
.my-component-header { }
.my-component-active { }
```

**Guideline**: If using nesting, keep it shallow (max 3 levels) to avoid specificity issues.

### Structure
```scss
// Custom CSS variables at top
:root {
  --my-theme-primary: #007acc;
  --my-theme-secondary: #cccccc;
}

// Override Obsidian variables in theme classes
.theme-dark {
  --background-primary: #1e1e1e;
}

.theme-light {
  --background-primary: #ffffff;
}

// Component styles
.my-component {
  background: var(--my-theme-primary);
  color: var(--text-normal);
}
```

### Best Practices
- Use SCSS nesting sparingly (max 3 levels)
- Always use Obsidian CSS variables when available
- Comment complex selectors and their purpose
- Group related styles together
- Test in both light and dark themes

### Performance
- Avoid universal selectors (`*`)
- Minimize CSS specificity
- Use efficient selectors (prefer classes over complex selectors)
- Keep CSS bundle size reasonable

### On Using `!important`

Per official Obsidian guidelines: **Avoid `!important` declarations**. Using `!important` prevents users from overriding your theme styles with CSS snippets.

If you must override plugin styles that use inline CSS or high specificity, document clearly:

```css
/* Override plugin X inline styles - !important unavoidable */
.plugin-x-element {
  color: var(--text-normal) !important;
}
```

### Keep Assets Local

**Required for community themes**: Themes must not load remote assets (fonts, images) that are unavailable offline. Remote assets may also violate user privacy.

Bundle all resources into your theme:
- Embed fonts as base64 or include font files
- Include images directly in the theme folder

See the official docs on [embedding fonts and images](https://docs.obsidian.md/Themes/App+themes/Embed+fonts+and+images+in+your+theme).

### Use Low-Specificity Selectors

The most common maintenance issues come from broken selectors when Obsidian updates change class names or element nesting.

Prefer overriding CSS variables over targeting specific classes:

```css
/* Preferred - uses CSS variables, low maintenance */
body {
  --font-text-size: 18px;
}

.theme-dark {
  --background-primary: #18004F;
}

/* Avoid - high specificity, may break on updates */
.workspace-leaf-content .markdown-source-view .cm-content .cm-line {
  font-size: 18px;
}
```