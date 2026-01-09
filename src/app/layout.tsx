import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "物体检测应用",
  description: "使用 TensorFlow.js 和 COCO-SSD 进行实时物体检测",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
