import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Saffron & Spice — Restaurant",
    template: "%s | Saffron & Spice",
  },
  description:
    "A neighborhood restaurant: browse the menu, reserve a table, and order online.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#faf7f2] text-stone-800 antialiased">
        {children}
      </body>
    </html>
  );
}
