import type { Metadata } from "next";

import { GalleryClient } from "@/app/gallery/_components/gallery-client";

export const metadata: Metadata = {
  title: "公開相簿｜Tiger Camera",
  description: "瀏覽選擇公開分享的 Tiger Camera 照片。",
};

export default function GalleryPage() {
  return (
    <main id="main-content" className="mx-auto min-h-svh max-w-7xl px-5 pb-20 pt-28 md:px-10">
      <GalleryClient />
    </main>
  );
}
