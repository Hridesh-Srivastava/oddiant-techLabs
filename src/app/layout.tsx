import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Oddiant Techlabs - IT & HR Consulting Firm",
  description:
    "Oddiant Techlabs is a bootstrapped consulting firm for IT, HR, Manpower & Recruitment, staffing services headquartered in Noida, India.",
  icons: {
    icon: [
      { url: "/images/logos/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/images/logos/favicon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Navbar />
        <main className="min-h-screen pt-16 bg-gray-50">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}