import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Penciled",
  description: "A booking scheduler.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1E5B43",
          colorBackground: "#F5F2EB",
          colorText: "#171512",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#171512",
          colorDanger: "#B3261E",
          fontFamily: "var(--font-instrument)",
          borderRadius: "8px",
          fontSize: "1rem",
        },
        elements: {
          formButtonPrimary: "min-h-[44px]",
          formFieldInput: "min-h-[44px] text-base",
          formFieldInput__focused: "ring-2 ring-[#1E5B43]",
        },
      }}
    >
      <html lang="en" className={`${fraunces.variable} ${instrument.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}