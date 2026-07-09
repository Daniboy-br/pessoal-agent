import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Nimbo — Pessoal Agent",
  description: "POC do Nimbo, um campo pessoal com cinco agentes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
