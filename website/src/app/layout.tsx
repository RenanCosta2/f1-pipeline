import type { Metadata } from "next";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NavigationProgressBar from "@/components/NavigationProgressBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "F1 Analytics Hub | Formula 1 Data Pipeline",
  description: "Dashboard analítico de Fórmula 1 alimentado por pipeline ELT Medallion, dbt e FastF1.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0D0D12] text-white antialiased flex flex-col md:flex-row min-h-screen">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 mx-auto w-full max-w-7xl 2xl:max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
