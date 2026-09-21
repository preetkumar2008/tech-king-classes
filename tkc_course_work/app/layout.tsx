import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech King Classes | Technology for Everyone",
  description:
    "Learn computer basics, programming, AI tools and web development from beginner to advanced with Tech King Classes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
