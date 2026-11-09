# Styling

The components come with one stylesheet, light and dark, in the look of Spectrum 2. Its colours are custom properties your app sets its own over.

```ts
import '@reboschedule/react/styles.css';
```

## Your colours

```css
.rsb,
.rse {
  --rp-brand: #0e7490;
  --rp-brand-hover: #155e75;
  --rp-brand-light: #e0f2f5;
}
```

| Property | What it colours |
| --- | --- |
| `--rp-brand` | Buttons, days with times, the time chosen, links. |
| `--rp-brand-light` | What is chosen, behind it. |
| `--rp-ink`, `--rp-soft`, `--rp-muted` | Text, from the darkest. |
| `--rp-line`, `--rp-gray-*` | Lines and surfaces, from 25 to 900. |
| `--rp-panel`, `--rp-surface` | Cards, and what is behind them. |
| `--rp-negative`, `--rp-positive` | What went wrong, and what is free. |

## Dark

The stylesheet follows `prefers-color-scheme`. A page that is always light sets the light values on `html .rsb, html .rse`, which win over the dark ones.

## Its classes

Every class has its prefix: `rsb-` the widget, `rse-` the editors and the panel, `rsc-` the month, `rsd-` the day, `rsp-` the panel. `className` puts one of yours on each root.

## Its words

The words are in `WORDS`, in English and Spanish, each a plain string or a function of a number.
