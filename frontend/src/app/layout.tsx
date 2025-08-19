import type { Metadata } from "next";
import { Poppins } from "next/font/google"; // ganti font
import "./globals.css";

// Import Poppins
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // pilih weight yang dibutuhkan
});

export const metadata: Metadata = {
  title: "RFID - Absensi", // nama aplikasi
  description: "Aplikasi absensi untuk SMK bekerja sama dengan UBIG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
