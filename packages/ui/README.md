# Shared UI and styling

`@repo/ui` owns the workspace design tokens, global base styles, and bundled Geist
fonts. Tailwind v4 uses CSS theme configuration instead of `tailwind.config.js`.
Edit `src/styles/global.css` to change colors, fonts, breakpoints, or shadows across
consuming apps. Tokens generate utilities such as `bg-brand`, `text-muted`,
`font-sans`, `font-mono`, and `shadow-input`.

Use Tailwind's spacing and typography scales (`p-4`, `gap-2`, `text-sm`,
`rounded-lg`) for components. Custom layout calculations and theme shadows use
rem units; responsive layouts also use percentages and viewport units.

## Use in a Next.js app

Add `"@repo/ui": "workspace:*"` to the app's dependencies and install its Tailwind
build tools from the repository root (replace `web` with your app's package name):

```powershell
pnpm --filter web add -D @tailwindcss/postcss@^4 postcss
pnpm install
```

Use the exported PostCSS configuration in the app's `postcss.config.mjs`:

```js
export { default } from "@repo/ui/postcss";
```

In the app's `app/globals.css`:

```css
@import "@repo/ui/global.css";
@source "./";
@source "../components";
```

Source paths are relative to this stylesheet. Adjust them for your app's folders
(for example `src/app` and `src/components`). The shared stylesheet already scans
UI package components. Explicit app sources ensure reliable scanning even when
the build runs from the monorepo root.

Import `./globals.css` once in the app's root layout. All pages then share the
theme, Tailwind preflight, focus styling, and local font files without configuring
`next/font` in each project. Geist is the default body font; use `font-mono` for
code. The Next.js bundler emits the font assets from this package.

Existing component exports, such as `@repo/ui/button`, continue to work. Theme
tokens, fonts, and base styles are maintained together in one shared stylesheet.

## Reusable controls

```tsx
import { Button, buttonStyles } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";
import { Field } from "@repo/ui/field";
import { Alert } from "@repo/ui/alert";

<Field>
  Email address
  <Input name="email" type="email" required />
</Field>
<Button type="submit" fullWidth loading={isSubmitting}>Sign in</Button>
<Button variant="outline" onClick={onCancel}>Cancel</Button>
```

Controls accept native HTML props, including refs, accessibility attributes, and
event handlers. Buttons default to `type="button"`; set `type="submit"` for forms.
`PasswordInput` manages its own accessible show/hide toggle. Use `buttonStyles()`
with a Next.js `Link` or an anchor to render navigation with button styling while
preserving link semantics. These components depend on React and the shared CSS,
not on Next.js or the authentication API. Import the shared stylesheet in each
consuming application as described above.

## Exports

| Export | Purpose |
| --- | --- |
| `@repo/ui/global.css` | Tailwind, shared theme, fonts, base styles, UI sources |
| `@repo/ui/postcss` | Shared Tailwind PostCSS configuration |

The `web` app is migrated. Other applications can opt in using this setup; their
existing styles are unaffected until they import it.
