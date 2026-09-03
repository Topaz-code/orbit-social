# Orbit — App Icon & Native Splash Screen

This folder contains the **source SVG artwork** for the Orbit app icon and the
native splash screen. The rasterised PNGs that Expo actually consumes live in
`../images/` and have already been generated from these SVGs (overwriting the
Expo defaults).

| Artwork | SVG source | Rasterised PNG (used by Expo) | Size |
|---|---|---|---|
| App icon (iOS + Android base) | `icon.svg` | `../images/icon.png` | 1024×1024 |
| Android adaptive icon (foreground) | `adaptive-icon.svg` | `../images/adaptive-icon.png` | 1024×1024 |
| Native splash screen | `splash.svg` | `../images/splash.png` | 1024×1024 |
| Splash/icon glyph | `icon.svg` | `../images/splash-icon.png` | 1024×1024 |
| Android legacy foreground | `icon.svg` | `../images/android-icon-foreground.png` | 512×512 |
| Android monochrome (themed icons) | `adaptive-icon.svg` | `../images/android-icon-monochrome.png` | 512×512 |
| Favicon (web) | `icon.svg` | `../images/favicon.png` | 48×48 |

Brand background colour: **`#111827`** (dark). Planet accent: gold/tan
`#D0A56A` / `#E8C58A`.

---

## 1. `app.json` configuration

The following is wired up in `mobile/app.json` (already applied). The two key
bits are the top-level `icon`/`splash` and the Android `adaptiveIcon`:

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "dark",
    "backgroundColor": "#111827",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#111827"
    },
    "ios": {
      "userInterfaceStyle": "dark"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#111827",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      }
    }
  }
}
```

> The **native** splash (shown before JS loads) is driven solely by the
> `splash` config + the PNG. The in-app `<SplashScreen />` React component is
> a separate, post-JS loader and does not control the native launch screen.

---

## 2. Source SVG — App Icon (`icon.svg`)

A cool gold/tan ringed planet on a dark `#111827` background. Copy this into
any vector editor (Figma / Illustrator / Inkscape) or use it directly with the
conversion commands below.

```svg
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1B2430"/>
      <stop offset="1" stop-color="#0F1620"/>
    </linearGradient>
    <radialGradient id="planet" cx="0.35" cy="0.30" r="0.85">
      <stop offset="0" stop-color="#E8C58A"/>
      <stop offset="0.45" stop-color="#D0A56A"/>
      <stop offset="1" stop-color="#9C7644"/>
    </radialGradient>
    <linearGradient id="ring" x1="180" y1="760" x2="860" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#71877B"/>
      <stop offset="0.5" stop-color="#D0A56A"/>
      <stop offset="1" stop-color="#E8C58A"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#D0A56A" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#D0A56A" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="planetClip"><circle cx="512" cy="556" r="238"/></clipPath>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g fill="#D9D0B8" opacity="0.55">
    <circle cx="205" cy="230" r="6"/><circle cx="835" cy="190" r="5"/>
    <circle cx="760" cy="800" r="6"/><circle cx="180" cy="760" r="5"/>
    <circle cx="880" cy="600" r="4"/><circle cx="300" cy="860" r="4"/>
  </g>
  <circle cx="512" cy="556" r="360" fill="url(#glow)"/>
  <ellipse cx="512" cy="556" rx="392" ry="150" transform="rotate(-24 512 556)" fill="none" stroke="url(#ring)" stroke-width="34" stroke-dasharray="900 400" stroke-dashoffset="660" stroke-linecap="round" opacity="0.9"/>
  <circle cx="512" cy="556" r="238" fill="url(#planet)"/>
  <g clip-path="url(#planetClip)">
    <ellipse cx="512" cy="640" rx="260" ry="120" fill="#7C5A30" opacity="0.35"/>
    <ellipse cx="430" cy="470" rx="70" ry="46" fill="#F4DDA9" opacity="0.55"/>
  </g>
  <ellipse cx="512" cy="556" rx="392" ry="150" transform="rotate(-24 512 556)" fill="none" stroke="url(#ring)" stroke-width="34" stroke-dasharray="560 740" stroke-dashoffset="-60" stroke-linecap="round"/>
  <circle cx="812" cy="430" r="34" fill="#E8C58A"/>
  <circle cx="802" cy="420" r="10" fill="#F4DDA9" opacity="0.8"/>
</svg>
```

The full, ready-to-use versions are saved as `icon.svg`, `adaptive-icon.svg`
and `splash.svg` in this folder.

---

## 3. How to convert the SVGs → PNGs and place them in `/assets`

You only need to do this if you want to **re-generate or tweak** the assets.
The PNGs are already in `assets/images/`. Pick ONE of the following.

### Option A — Figma / Illustrator / Sketch (easiest, no CLI)
1. Open the SVG in Figma (File ▸ Place Image / drag & drop).
2. Select the frame → **Export**.
3. Choose **PNG**, set the size:
   - `icon.svg` → **1024 × 1024**
   - `adaptive-icon.svg` → **1024 × 1024**
   - `splash.svg` → **1024 × 1024** (or a taller canvas, e.g. 1284 × 2778)
4. Export and **overwrite** the matching files in `mobile/assets/images/`
   (see the table at the top).

### Option B — Command line with `sharp` (Node, high quality)
From the `mobile/` folder:
```bash
npm i -D sharp
node -e "const s=require('sharp');
(async()=>{
  await s('assets/brand/icon.svg').resize(1024,1024).png().toFile('assets/images/icon.png');
  await s({create:{width:1024,height:1024,channels:4,background:'#111827'}})
    .composite([{input:await s('assets/brand/adaptive-icon.svg').resize(1024,1024).png().toBuffer()}]).png()
    .toFile('assets/images/adaptive-icon.png');
  await s({create:{width:1024,height:1024,channels:4,background:'#111827'}})
    .composite([{input:await s('assets/brand/splash.svg').resize(1024,1024).png().toBuffer(),fit:'contain'}]).png()
    .toFile('assets/images/splash.png');
})();"
```

### Option C — `@resvg/resvg-js` (what this repo used)
```bash
mkdir /tmp/svg2png && cd /tmp/svg2png && npm i @resvg/resvg-js
# then render each SVG with fitTo width = target px, background "#111827"
```

### Option D — Inkscape / rsvg
```bash
# Inkscape
inkscape icon.svg -w 1024 -h 1024 --export-type=png --export-filename=../images/icon.png
# librsvg
rsvg-convert -w 1024 -h 1024 -b "#111827" icon.svg -o ../images/icon.png
```

### After generating
1. Confirm every PNG in `mobile/assets/images/` listed in the table was
   overwritten (sizes shown above).
2. From `mobile/`, run a clean rebuild so native picks up the new assets:
   ```bash
   npx expo prebuild --clean     # for development builds
   # or, for EAS:
   eas build --profile production --platform all
   ```
   > The native splash/icon are compiled into the app binary — a normal JS
   > reload / OTA update will **not** change them. You must rebuild the dev
   > client / submit a new build.
3. Launch: the launch screen should show the Orbit planet on `#111827`, and
   the home-screen icon should be the gold planet.

---

## Design notes
- **Android adaptive icon**: the OS masks the outer ~33% into a circle/square.
  `adaptive-icon.svg` keeps the planet + ring inside the central safe zone and
  relies on `backgroundColor: "#111827"` for the backdrop.
- **Splash**: `resizeMode: "contain"` centres the artwork on the `#111827`
  background across all screen aspect ratios without cropping.
