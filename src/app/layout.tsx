import type { Metadata } from "next";
import { Montserrat, Inter, Fraunces } from "next/font/google";
import { GlobalNav } from "@/components/navigation/global-nav";
import { GlobalFooter } from "@/components/navigation/global-footer";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AgentIndex — Find Real Estate Agents in Australia",
    template: "%s | AgentIndex",
  },
  description:
    "Australia's most comprehensive real estate agent directory. Compare agents by sales history, reviews, and verified credentials.",
  metadataBase: new URL("https://agentindex.com.au"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${inter.variable} ${fraunces.variable}`}
    >
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <GlobalNav />
        <main className="min-h-screen">{children}</main>
        <GlobalFooter />
      </body>
    </html>
  );
}
