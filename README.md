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

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/embeddy
   cd embeddy
   npm install
   ```

2. Set up your environment variables:
   Copy [`.env.example`](file:///d:/React/embeddy/.env.example) to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
