import type { Metadata } from "next";

import { GalleryClient } from "@/components/gallery/gallery-client";

export const metadata: Metadata = {
  title: "我的相簿｜Tiger Camera",
  description: "上傳、查看與管理 Tiger Camera 的私人照片。",
};

export default function GalleryPage() {
  return (
    <main id="main-content" className="mx-auto min-h-svh max-w-7xl px-5 pb-20 pt-28 md:px-10">
      <GalleryClient />
    </main>
  );
}
