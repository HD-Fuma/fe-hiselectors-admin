# Sidebar Accordion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the original dark-gray sidebar palette and add independently collapsible menu groups.

**Architecture:** Keep accordion state inside `AdminSidebar`; group heading buttons own only their group's visibility. CSS tokens supply the restored palette and CSS handles chevron rotation and hidden menu layout.

**Tech Stack:** React, TypeScript, CSS custom properties, lucide-react.

---

### Task 1: Restore palette and add accordion UI

**Files:**
- Modify: `src/components/shell/AdminSidebar.tsx`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/admin.css`

- [ ] Add an all-open initial accordion state and group heading buttons with `aria-expanded` and `aria-controls`.
- [ ] Hide only a toggled group's link list and rotate its chevron.
- [ ] Replace green-tinted charcoal sidebar tokens with original neutral dark-gray values while retaining teal selection.
- [ ] Build once to catch TypeScript errors. Automated tests are intentionally skipped at the user's request.
- [ ] Commit the UI-only change.
