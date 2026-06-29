import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Embeddy — AI Embedded Systems Design Assistant",
  description:
    "AI-powered embedded systems design assistant. Generate circuit schematics, pin diagrams, BOM, power budgets, and code skeletons in seconds.",
  keywords: "embedded systems, Arduino, ESP32, circuit design, AI, electronics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
