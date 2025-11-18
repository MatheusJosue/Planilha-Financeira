import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { StoreInitializer } from "@/components/StoreInitializer";
import { FloatingAddButton } from "@/components/FloatingAddButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Planilha Financeira",
  description: "Controle suas finanças pessoais de forma simples e eficiente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <StoreInitializer />
        <Navigation />
        <main className="container py-4">{children}</main>
        <FloatingAddButton />
      </body>
    </html>
  );
}
