import type { Metadata } from "next";
import { Toaster } from "sonner";
import { LocalAgentationOverlay } from "../components/local-agentation-overlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "Case Study",
  description: "Case-study application",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" richColors />
        <LocalAgentationOverlay />
      </body>
    </html>
  );
}
