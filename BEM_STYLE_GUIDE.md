# BEM Methodology Style Guide

## Overview
This document outlines the BEM (Block Element Modifier) methodology implementation for the project's CSS architecture.

## BEM Structure

### Block
The standalone entity that is meaningful on its own.
```css
.block {}
```

### Element
A part of a block that has no standalone meaning and is semantically tied to its block.
```css
.block__element {}
```

### Modifier
A flag on a block or element. Use them to change appearance or behavior.
```css
.block--modifier {}
.block__element--modifier {}
```

## Implemented Components

### 1. Navigation Component (.nav)
**Block:** `.nav`
**Elements:**
- `.nav__row` - Container for navigation buttons
- `.nav__button` - Individual navigation button
- `.nav__button--active` - Active state modifier
- `.nav__button--toggle` - Toggle button modifier

**Usage Example:**
```html
<nav class="nav">
  <div class="nav__row">
    <button class="nav__button nav__button--active">Home</button>
    <button class="nav__button">Menu</button>
    <button class="nav__button nav__button--toggle">☰</button>
  </div>
</nav>
```

### 2. Product Component (.product)
**Block:** `.product`
**Elements:**
- `.product__title` - Product name/title
- `.product__title--liquor` - Liquor-specific title modifier
- `.product__media` - Media container
- `.product__image` - Product image
- `.product__video-thumbnail` - Video thumbnail
- `.product__ingredients` - Ingredients description
- `.product__prices` - Prices container
- `.product__price-item` - Individual price item
- `.product__price-label` - Price label
- `.product__price-button` - Price button
- `.product__price-button--selected` - Selected price modifier

**Usage Example:**
```html
<div class="product">
  <h3 class="product__title product__title--liquor">Whiskey Premium</h3>
  <div class="product__media">
    <img class="product__image" src="whiskey.jpg" alt="Whiskey">
  </div>
  <p class="product__ingredients">Premium aged whiskey...</p>
  <div class="product__prices">
    <div class="product__price-item">
      <span class="product__price-label">750ml</span>
      <button class="product__price-button product__price-button--selected">$45</button>
    </div>
  </div>
</div>
```

### 3. Modal Component (.modal)
**Block:** `.modal`
**Elements:**
- `.modal__backdrop` - Background overlay
- `.modal__content` - Main content container
- `.modal__header` - Header section
- `.modal__title` - Modal title
- `.modal__close` - Close button
- `.modal__body` - Body content
- `.modal__actions` - Action buttons container

**Usage Example:**
```html
<div class="modal">
  <div class="modal__backdrop"></div>
  <div class="modal__content">
    <div class="modal__header">
      <h2 class="modal__title">Product Details</h2>
      <button class="modal__close">×</button>
    </div>
    <div class="modal__body">
      <!-- Content -->
    </div>
    <div class="modal__actions">
      <button>Cancel</button>
      <button>Confirm</button>
    </div>
  </div>
</div>
```

### 4. Sidebar Component (.sidebar)
**Block:** `.sidebar`
**Elements:**
- `.sidebar--open` - Open state modifier
- `.sidebar__header` - Header section
- `.sidebar__title` - Sidebar title
- `.sidebar__content` - Main content
- `.sidebar__nav` - Navigation list
- `.sidebar__nav-item` - Navigation item
- `.sidebar__nav-link` - Navigation link
- `.sidebar__nav-link--active` - Active link modifier

**Usage Example:**
```html
<aside class="sidebar sidebar--open">
  <div class="sidebar__header">
    <h2 class="sidebar__title">Menu</h2>
  </div>
  <div class="sidebar__content">
    <ul class="sidebar__nav">
      <li class="sidebar__nav-item">
        <a href="#" class="sidebar__nav-link sidebar__nav-link--active">Home</a>
      </li>
      <li class="sidebar__nav-item">
        <a href="#" class="sidebar__nav-link">Products</a>
      </li>
    </ul>
  </div>
</aside>
```

## Naming Conventions

### Rules
1. Use lowercase and hyphens for multi-word blocks
2. Use double underscores (__) to separate block from element
3. Use double hyphens (--) to separate modifier from block/element
4. Be descriptive but concise
5. Avoid abbreviations when possible

### Examples
✅ **Good:**
- `.product__price-button`
- `.nav__button--active`
- `.modal__content`

❌ **Bad:**
- `.product-price-btn` (inconsistent separator)
- `.nav_button_active` (wrong separators)
- `.modal-cont` (abbreviation)

## Benefits of BEM Implementation

### 1. Improved Specificity Management
- Flat specificity hierarchy
- Reduced need for `!important`
- Predictable cascade behavior

### 2. Better Maintainability
- Clear component boundaries
- Self-documenting code
- Easier refactoring

### 3. Enhanced Reusability
- Modular components
- Consistent naming patterns
- Portable code blocks

### 4. Team Collaboration
- Standardized methodology
- Clear naming conventions
- Reduced naming conflicts

## Migration Strategy

### Phase 1: Core Components (Completed)
- Navigation system
- Product cards
- Modal dialogs
- Sidebar components

### Phase 2: Secondary Components (Next)
- Forms and inputs
- Tables and grids
- Buttons and controls
- Layout containers

### Phase 3: Utility Classes
- Spacing utilities
- Typography utilities
- Color utilities
- Display utilities

## Best Practices

### 1. Component Isolation
Each BEM block should be independent and reusable.

### 2. Avoid Deep Nesting
Keep element hierarchy flat:
```css
/* Good */
.card__header {}
.card__title {}

/* Avoid */
.card__header__title {}
```

### 3. Use Modifiers Sparingly
Only create modifiers for actual variations:
```css
/* Good */
.button--primary {}
.button--large {}

/* Avoid */
.button--blue {}
.button--red {}
```

### 4. Consistent Naming
Maintain consistent vocabulary across components:
- Use `title` not `heading` or `name`
- Use `content` not `body` or `text`
- Use `button` not `btn` or `link`

## File Organization

### Structure
```
styles/
├── components/
│   ├── _nav.css
│   ├── _product.css
│   ├── _modal.css
│   └── _sidebar.css
├── utilities/
│   ├── _spacing.css
│   ├── _typography.css
│   └── _colors.css
└── main.css
```

### Import Order
1. Variables and mixins
2. Base styles
3. Layout components
4. UI components
5. Utilities
6. Media queries

## Validation Checklist

- [ ] All components follow BEM naming convention
- [ ] No nested elements beyond one level
- [ ] Modifiers are meaningful and necessary
- [ ] Components are independent and reusable
- [ ] Naming is consistent across similar components
- [ ] Documentation is updated for new components

## Related Files
- `main.css` - Main stylesheet with BEM implementation
- `BREAKPOINTS_DOCUMENTATION.md` - Responsive design guide
- Component-specific CSS files (when separated)

---

**Last Updated:** Phase 5 Implementation
**Status:** ✅ Core Components Implemented
**Next Steps:** Secondary components and utility classes