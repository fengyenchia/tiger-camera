import type { Metadata } from "next";

import { PhotoProcessor } from "@/app/create/_components/photo-processor";

export const metadata: Metadata = {
  title: "領取與後製照片｜Tiger Camera",
  description: "輸入 Tiger Camera 領取碼，在自己的手機後製、下載或選擇公開照片。",
};

export default function CreatePage() {
  return (
    <main id="main-content" className="mx-auto min-h-svh max-w-7xl px-5 pb-20 pt-28 md:px-10">
      <PhotoProcessor />
    </main>
  );
}
