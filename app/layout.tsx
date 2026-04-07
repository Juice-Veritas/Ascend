import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ascend | Cyberpunk Life RPG",
  description:
    "A cyberpunk-inspired life RPG for translating real-world training into visible progression.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
