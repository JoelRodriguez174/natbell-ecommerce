import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/components/ui/Toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    template: "%s | Los Arrayanes — Belleza & Peluquería",
    default: "Los Arrayanes — Insumos y Productos de Peluquería y Belleza",
  },
  description:
    "Distribuidora de productos profesionales de belleza, peluquería, coloración, tratamientos capilares, barbería y estética en Argentina. Envíos a todo el país.",
  keywords: [
    "peluquería",
    "belleza",
    "tinturas",
    "tratamientos capilares",
    "barbería",
    "máquinas de corte",
    "Los Arrayanes",
    "Argentina",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-rose-500 selection:text-white">
        <ToastProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
