# Embeddy

AI-powered embedded systems design assistant for Arduino, ESP32, and STM32.
Describe your project, pick your board, and Embeddy's 9 parallel AI agents generate everything you need to get started — in under 30 seconds.

## What it generates

- Interactive circuit schematic (Konva.js canvas)
- Pin wiring diagram with signal types
- Starter firmware (C++ / MicroPython)
- Power budget & USB load analysis
- Bill of Materials with LKR cost estimates
- Component compatibility checks
- Fatal issue & safety flags

## Stack

- **Next.js 14** — App Router, server + client components
- **Gemini API** — 9 parallel AI agents for design generation
- **Firebase** — Authentication (email/password) + Firestore cloud storage
- **Konva.js** — Interactive circuit schematic canvas
- **Tailwind CSS** — Styling
- **TypeScript** — End to end type safety

## Getting started

```bash
git clone https://github.com/yourusername/embeddy
cd embeddy
npm install
```

Create `.env.local` with your API keys:

```env
GEMINI_API_KEY=your_gemini_key

NEXT_PUBLIC_FB_API_KEY=
NEXT_PUBLIC_FB_AUTH_DOMAIN=
NEXT_PUBLIC_FB_PROJECT_ID=
NEXT_PUBLIC_FB_STORAGE_BUCKET=
NEXT_PUBLIC_FB_SENDER_ID=
NEXT_PUBLIC_FB_APP_ID=
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```
