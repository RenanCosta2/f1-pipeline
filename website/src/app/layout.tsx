import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NavigationProgressBar from "@/components/NavigationProgressBar";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0D12",
};

export const metadata: Metadata = {
  title: "Pitwall",
  description: "Plataforma analítica e telemetria de Fórmula 1 com dados históricos, tempos de volta, estratégias de pneus e estatísticas oficiais.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0D0D12] text-white antialiased flex flex-col md:flex-row min-h-screen selection:bg-f1-red/30 selection:text-white">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 mx-auto w-full max-w-7xl 2xl:max-w-[1600px] px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
