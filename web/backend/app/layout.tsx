import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiger Camera API",
  description: "Tiger Camera Backend API and OpenAPI documentation",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
