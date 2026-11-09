# Estilos

Los componentes traen una hoja de estilos, clara y oscura, al estilo de Spectrum 2. Sus colores son propiedades que tu aplicación puede cambiar por las suyas.

```ts
import '@reboschedule/react/styles.css';
```

## Tus colores {#your-colours}

```css
.rsb,
.rse {
  --rp-brand: #0e7490;
  --rp-brand-hover: #155e75;
  --rp-brand-light: #e0f2f5;
}
```

| Propiedad | Qué colorea |
| --- | --- |
| `--rp-brand` | Botones, días con horarios, el horario elegido, ligas. |
| `--rp-brand-light` | Lo elegido, de fondo. |
| `--rp-ink`, `--rp-soft`, `--rp-muted` | El texto, del más oscuro al más claro. |
| `--rp-line`, `--rp-gray-*` | Líneas y superficies, del 25 al 900. |
| `--rp-panel`, `--rp-surface` | Las tarjetas, y lo que está detrás. |
| `--rp-negative`, `--rp-positive` | Lo que salió mal, y lo que está libre. |

## Oscuro {#dark}

La hoja sigue `prefers-color-scheme`. Una página que siempre es clara pone los valores claros en `html .rsb, html .rse`, que ganan sobre los oscuros.

## Sus clases {#its-classes}

Cada clase lleva su prefijo: `rsb-` el widget, `rse-` los editores y el panel, `rsc-` el mes, `rsd-` el día, `rsp-` el panel. `className` pone una tuya en cada raíz.

## Sus palabras {#its-words}

Las palabras están en `WORDS`, en inglés y español, cada una un texto o una función de un número.
