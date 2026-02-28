# Styling: Using theme tokens

Use theme tokens from `@shared/ui-kit` instead of hardcoding **colors, font sizes, spacing, and border radius** in the codebase.

## 1. Colors

- **Dynamic colors** (theme / dark mode aware): use `useThemeColor('token')`.
- Hooks cannot be used inside `StyleSheet.create`; get colors in the component and merge with `style={[styles.xxx, { color: textColor }]}`.
- **Static colors** (light-only, never change): `colors.light.xxx` (prefer avoiding; can cause inconsistency when dark mode is added).

**Token examples:** `text`, `textSecondary`, `background`, `surfaceAlt`, `accent`, `headerBg`, `buttonPrimary`, `buttonPrimaryText`, `error`, `border`, `mainText`, `subText`, etc. (full list: `features/ui-kit/theme/colors.ts`)

```tsx
import { useThemeColor } from '@shared/ui-kit';

const textColor = useThemeColor('text');
const bgColor = useThemeColor('surfaceAlt');
// ...
<AppText style={[styles.title, { color: textColor }]} />
<View style={[styles.card, { backgroundColor: bgColor }]} />
```

## 2. Typography (font size, weight)

- **fontSize:** `typography.xs | caption | sm | base | lg | xl | featured | 2xl | 3xl | 4xl`
- **fontWeight:** `typography.weights.regular | medium | semibold | bold`
- Can be used directly in StyleSheet: `...typography.sm`, `fontWeight: typography.weights.bold`

**Mapping (hardcoded → token):**

| Old (example) | Token |
|---------------|--------|
| 12            | typography.xs |
| 13            | typography.caption |
| 14            | typography.sm |
| 16            | typography.base |
| 18            | typography.lg |
| 20            | typography.xl |
| 22            | typography.featured |
| 24            | typography['2xl'] |
| '600'         | typography.weights.semibold |
| '700'         | typography.weights.bold |

```tsx
import { typography } from '@shared/ui-kit';

const styles = StyleSheet.create({
  title: { ...typography.lg, fontWeight: typography.weights.bold },
  body: { ...typography.sm, fontWeight: typography.weights.regular },
});
```

## 3. Spacing (padding, margin, gap)

- **Tokens:** `spacing.xs | sm | md | smd | lg | xl | 2xl | 3xl | 4xl` (4px base: 4, 8, 12, 14, 16, 20, 24, 32, 48)
- Use these tokens for padding, margin, and gap; avoid hardcoding numbers when possible.

**Mapping (example):**

| Old (example) | Token |
|---------------|--------|
| 4             | spacing.xs |
| 8             | spacing.sm |
| 12            | spacing.md |
| 14            | spacing.smd |
| 16            | spacing.lg |
| 20            | spacing.xl |
| 24            | spacing['2xl'] |
| 32            | spacing['3xl'] |

```tsx
import { spacing } from '@shared/ui-kit';

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  row: { gap: spacing.md, marginBottom: spacing.sm },
});
```

## 4. Border radius (radii)

- **Tokens:** `radii.sm | md | rounded | lg | xl | full`
- Values: sm 6, md 8, rounded 10, lg 12, xl 16, full 999 (pill)

```tsx
import { radii } from '@shared/ui-kit';

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg },
  button: { borderRadius: radii.full },
});
```

## 5. Migration plan (replacing existing code with theme)

1. **Open the file** (screen or component).
2. **Colors:** Find all `#hex`, `'rgb(...)'`, `'rgba(...)'` values. Pick a suitable `ColorToken`, get it in the component with `useThemeColor('token')`, and pass it via `style={[styles.xxx, { color: or backgroundColor: ... }]}`.
3. **Font:** Replace `fontSize` and `fontWeight` with `typography` tokens using the tables above.
4. **Spacing:** Use the nearest `spacing` token for `padding*`, `margin*`, and `gap`.
5. **Radius:** Use `radii` tokens for `borderRadius`.
6. If a value does **not** exist in the theme (e.g. 10px font, 10px spacing) but is used often, add a new token in `theme/typography.ts` or `theme/spacing.ts` first, then update the code to use it.

This keeps colors, sizes, and typography in one place; for dark mode or design updates you only need to change the theme files.
