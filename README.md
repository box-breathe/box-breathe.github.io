# BoxBreathe | Free Online 4-4-4-4 Box Breathing & Focus Tool

> **Live Application**: [https://box-breathe.github.io](https://box-breathe.github.io)  
> **Support Developer**: [buymeacoffee.com/kisharadilz](https://buymeacoffee.com/kisharadilz)

An ultra-minimal, 100% client-side web application built with **Astro**, **React**, and **Tailwind CSS**. BoxBreathe guides users through calming 4-4-4-4 box breathing (square breathing) cycles using fluid geometric animations and optional synthesized Web Audio API ambient singing bowl chimes. Zero server dependencies, zero tracking, and total user privacy.

---

## 🧘 Key Features

- **Geometric Visual Box Pacer**: A centerpiece square dynamically animates across the 4 stages of square breathing (Inhale ➔ Hold In ➔ Exhale ➔ Hold Out) with an active perimeter tracker and comet head tracer.
- **Customizable Pacing**: Quick-select duration pills for all experience levels:
  - `3s`: Beginner
  - `4s`: Navy SEAL Standard (Gold Standard)
  - `5s`: Deep Calm
  - `6s`: Advanced Meditation
- **Synthesized Web Audio Zen Chimes**: Zero-asset audio engine generating pure harmonic singing bowl frequencies (528 Hz transformation, 660 Hz centering, 396 Hz grounding, 330 Hz resting) with natural exponential decay. Works 100% offline with zero external audio downloads.
- **Session Tracker**: Non-intrusive session statistics tracking completed breathing cycles and mindful minutes stored purely in browser `localStorage`.
- **Keyboard Shortcuts**:
  - `Space`: Start / Pause / Resume
  - `M`: Toggle Sound (Mute / Unmute)
  - `R`: Reset current session
- **7-Language Internationalization (i18n)**:
  - 🇺🇸 English (`/`)
  - 🇪🇸 Español (`/es/`)
  - 🇧🇷 Português (`/pt/`)
  - 🇩🇪 Deutsch (`/de/`)
  - 🇫🇷 Français (`/fr/`)
  - 🇯🇵 日本語 (`/ja/`)
  - 🇨🇳 简体中文 (`/zh/`)
- **Icon-Only Responsive Navbar**: Full labels on desktop, strictly collapsing to touch-friendly icon buttons on tablet and mobile viewports.
- **Flawless Light & Dark Themes**: Soft alabaster/slate `#F8FAFC` light mode and deep midnight slate `#0F172A` dark mode with glowing cyan/teal auras.
- **Peak Technical SEO**: Full Schema.org JSON-LD structured data (`WebApplication`, `HowTo`, and `FAQPage`), OpenGraph cards, Twitter cards, and bidirectional `hreflang` tags.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Astro 5](https://astro.build) (Static Site Generation for instant load times and subpath routing)
- **Interactive Islands**: [React 19](https://react.dev) with high-precision `requestAnimationFrame` timing logic
- **Acoustic Synthesizer**: Native [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (`OscillatorNode`, `GainNode`, and LFO harmonic vibrato)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) configured for minimal, distraction-free aesthetics

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+` or `v20+` (tested on Node `v24.x`)
- npm, pnpm, or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/box-breathe/box-breathe.github.io.git
cd box-breathe.github.io

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:4321` in your browser.

### Production Build

```bash
# Build static site to /dist
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deployment to GitHub Pages

This project is configured as a root-level static site generator. The generated static build in `/dist` can be deployed directly via GitHub Actions:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build site
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## ☕ Support the Developer

If BoxBreathe helped you regain calm and mental clarity, consider supporting future development:  
👉 **[buymeacoffee.com/kisharadilz](https://buymeacoffee.com/kisharadilz)**

---

## 📄 License

MIT License. Free for personal and commercial use.
