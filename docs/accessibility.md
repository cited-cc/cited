# Accessibility

Cited is built with accessibility-oriented practices. This document does not claim formal WCAG certification.

## Practices

- Semantic headings on marketing, legal, docs, and app pages
- Keyboard-accessible navigation, dialogs, sheets, tabs, and forms
- Visible focus states via design-system controls
- Labels preferred over placeholder-only inputs
- Color is not the sole signal for citation state
- Reduced-motion preferences respected in motion utilities
- Mobile tap targets sized for primary actions
- Screen-reader labels on icon-only buttons
- Legal pages use readable document typography and a table of contents
- Error and not-found pages expose clear recovery actions

## Priority surfaces

- `/`, `/pricing`, `/scan`, `/docs`, legal pages
- `/app`, Inbox, citation detail, Notebook, settings, billing
- Onboarding, checkout, unsubscribe

## Manual checks

1. Tab through legal pages, docs nav, app shell, settings, and billing.
2. Confirm focus is visible and not trapped unexpectedly.
3. Confirm dialogs and sheets close with Escape and restore focus.
4. Confirm form errors are announced and associated with fields.
5. Confirm 320px layouts remain usable without horizontal clipping of primary content.
