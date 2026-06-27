# Embeddy

AI-powered embedded systems design assistant for Arduino, ESP32, and STM32.
Describe your project, pick your board, and Embeddy generates everything you need to get started.

## TODO
- Remake the UI to be enterprise-grade
- More accurate BOM with price RAGs

## What it generates

- Circuit schematic
- Pin wiring diagram
- Starter code (Arduino / ESP-IDF / STM32 HAL)
- Power budget
- Bill of Materials
- Component compatibility checks
- Fatal issue flags

## Stack

- Next.js 14
- Gemini API (gemini-3.1-flash-lite)
- Konva.js
- Tailwind CSS

## Getting started

```bash
git clone https://github.com/yourusername/embeddy
cd embeddy
npm install
```

Add your Gemini API key to `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```
