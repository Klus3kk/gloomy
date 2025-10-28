import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

export const metadata: Metadata = {
  title: "Gloomy - File Downloader",
  description: "Securely download files with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col text-white">
        <Providers>
          <GlobalHeader />
          <main className="flex-1">{children}</main>
          <GlobalFooter />
        </Providers>
      </body>
    </html>
  );
}
