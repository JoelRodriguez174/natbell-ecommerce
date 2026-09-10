import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Natbell — Tienda de Belleza y Peluquería Profesional",
  description:
    "E-commerce oficial de productos y cosmética profesional para el cabello, barbería y estética.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white font-sans">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
