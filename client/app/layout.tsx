import type { Metadata } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const displaySerif = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "개인 텍스트 비서",
  description: "텍스트 명령으로 PC 작업을 수행하는 개인 비서",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={displaySerif.variable}>
      <body>{children}</body>
    </html>
  );
}
