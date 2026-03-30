import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "@/shared/lib/Providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "таскинатор",
  description: "максимально простая и удобная CRM с канбан-доской",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-manrope)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
