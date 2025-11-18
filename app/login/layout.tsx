import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Planilha Financeira",
  description: "Faça login ou crie sua conta",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-100 h-100">{children}</div>;
}
