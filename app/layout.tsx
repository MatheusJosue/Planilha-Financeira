"use client";

import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { StoreInitializer } from "@/components/StoreInitializer";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import PendingRecurringNotification from "@/components/PendingRecurringNotification";
import { ThemeProvider } from "@/components/ThemeProvider";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth");

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <StoreInitializer />
          {!isAuthPage && <Navigation />}
          {!isAuthPage ? (
            <main className="container py-4">{children}</main>
          ) : (
            children
          )}
          {!isAuthPage && <FloatingAddButton />}
          {!isAuthPage && <PendingRecurringNotification />}
        </ThemeProvider>
      </body>
    </html>
  );
}
