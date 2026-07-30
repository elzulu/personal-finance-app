import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegistration } from "@/components/PwaRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finanzas Personales",
  description: "Control de ingresos y egresos del hogar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finanzas",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <PwaRegistration />
      </body>
    </html>
  );
}
