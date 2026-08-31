import type { Metadata } from "next";
import { Fraunces, Work_Sans, UnifrakturCook, Give_You_Glory } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const body = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const mark = UnifrakturCook({
  subsets: ["latin"],
  variable: "--font-mark",
  display: "swap",
  weight: ["700"],
});

const script = Give_You_Glory({
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Iron Rose Tattoo Co.",
  description: "Cinematic custom tattoo studio — blackwork, fine line, ornamental.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mark.variable} ${script.variable} scroll-smooth`}
    >
      <body className="font-body bg-void text-parchment antialiased">
        {children}
      </body>
    </html>
  );
}