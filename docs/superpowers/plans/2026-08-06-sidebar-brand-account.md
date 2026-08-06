# Sidebar Brand and Account Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic sidebar identity with Selectors branding and show the signed-in administrator in a fixed sidebar footer.

**Architecture:** `AdminSidebar` owns the brand and account markup while existing sidebar grid CSS adds a fixed footer below the independently scrolling menu area. `AdminTopbar` keeps only utility actions so account data has one visible home.

**Tech Stack:** React, TypeScript, lucide-react, CSS.

---

### Task 1: Brand and account UI

**Files:**
- Modify: `src/components/shell/AdminSidebar.tsx`
- Modify: `src/components/shell/AdminTopbar.tsx`
- Modify: `src/styles/admin.css`

- [ ] Replace the generic brand copy with Selectors branding.
- [ ] Add fixed administrator name, role, and explicit logout action to the sidebar footer.
- [ ] Remove duplicated administrator name and role from the top bar.
- [ ] Preserve the menu's independent scroll area and build once. Automated tests remain skipped at the user's request.
- [ ] Commit the UI-only change.
