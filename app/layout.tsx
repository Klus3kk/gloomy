import type { Metadata } from "next";
import "./globals.css";

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
      <body className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Sticky Header */}
        <header className="bg-gradient-to-r from-[#0d1c26] via-[#132636] to-[#1c3b4d] bg-opacity-80 backdrop-blur-lg shadow-lg sticky top-0 z-50 py-4 px-8">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            {/* Logo as an Image */}
            <a href="/" className="flex items-center space-x-3">
              <img
                src="/logo.png" 
                alt="Gloomy Logo"
                className="h-16 w-auto object-contain scale-150"
              />
            </a>

            <nav className="space-x-6">
              <a
                href="/downloads"
                className="text-lg text-[#f0f6fc] hover:text-[#ff7f50] transition"
              >
                Downloads
              </a>
              <a
                href="/about"
                className="text-lg text-[#f0f6fc] hover:text-[#ff7f50] transition"
              >
                About
              </a>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6 text-center">
          <p>&copy; {new Date().getFullYear()} ClueSec. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
