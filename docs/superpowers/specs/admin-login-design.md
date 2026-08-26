# Admin login visual redesign

## Goal

Restyle `/login` as an administrator-focused hihi experience inspired by the approved black canvas and floating white card direction. Keep the existing authentication flow, fields, validation, loading state, errors, session persistence, and safe return navigation intact.

## Visual direction

- Use a soft neutral page background around one large rounded black stage.
- Divide the stage into a spacious brand panel and a white login card aligned on the right.
- Render `public/brand/thehyundai-hi.svg` as the primary hihi wordmark.
- Use black as the action and focus color. Use charcoal and graphite for the supporting artwork.
- Build the background artwork from layered CSS shapes so the page stays lightweight and responsive.
- Present the administrator context with the visible labels `HI-SELECTORS ADMIN`, `관리자 로그인`, and `셀렉터스 운영을 한곳에서`.

## Layout

### Desktop

- Center a stage with a maximum width near 1180px and a minimum height near 680px inside the viewport.
- Give the brand panel roughly 58% of the width and the login area roughly 42%.
- Place the brand message toward the lower-left portion of the stage.
- Place a white card around 400–420px wide inside the right column.
- Use broad corner radii and a restrained shadow to reproduce the reference image's depth.

### Tablet and mobile

- Switch to a vertical composition around 840px.
- Convert the brand panel into a compact top section with the same hihi identity and monochrome artwork.
- Let the white card fill the available width with touch-friendly controls.
- Preserve comfortable viewport padding down to 390px.

## Component boundaries

- `LoginPage` continues to own authentication state and submission.
- The page adds presentational brand-panel and card wrappers directly in `LoginPage`; the pattern currently serves one route, so a shared component adds little value.
- `login.css` owns the full visual treatment, responsive layout, focus styling, and reduced-motion behavior.
- Existing authentication helpers and API modules keep their current interfaces.

## Interaction and accessibility

- Keep username autofocus and current autocomplete values.
- Keep the form label, `aria-busy`, alert role, disabled controls, and visible loading text.
- Provide a high-contrast focus ring for inputs and the login button.
- Treat the abstract brand artwork as decorative content.
- Respect `prefers-reduced-motion` for the small card entrance transition.

## Error handling and data flow

Submission continues through `loginAdministrator`, then `persistAdministratorSession`, then replace navigation to the safe return path. Empty-field and backend error messages retain their current wording and placement inside the login card.

## Testing and verification

- Extend the login component test with hihi logo and administrator-heading assertions while retaining every authentication assertion.
- Update visual geometry assertions to target the new stage and card contract.
- Run the focused login tests first.
- Run `npm run check` as the final automated verification.
- Report `/login` as the manual visual verification route.
- Follow the repository rule for browser-based visual checks and leave that check to the user unless they request browser execution.

## Scope

Expected implementation files are `src/features/auth/LoginPage.tsx`, `src/styles/login.css`, and directly related login tests. The work introduces no dependency, API change, route change, social login, credential recovery, or remember-me behavior.
