import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tiger-camera.fengyenchia.com"),
  title: "Tiger Camera｜我的小相簿",
  description: "保存 Tiger Camera 拍下的原圖與可愛復古照片。",
  openGraph: {
    title: "Tiger Camera｜我的小相簿",
    description: "保存 Tiger Camera 拍下的原圖與可愛復古照片。",
    url: "https://tiger-camera.fengyenchia.com",
    siteName: "Tiger Camera",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "zh-Hant",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-Hant" className="antialiased processor-scrollbar" data-scroll-behavior="smooth">
      <body>
        <SiteNavbar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
