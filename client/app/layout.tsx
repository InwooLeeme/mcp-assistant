import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
