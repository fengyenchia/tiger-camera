import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const highlights = ["NFC 快速開啟", "領取碼配對照片", "公開由你決定"];

export default function Home() {
  return (
    <main id="main-content">
      <section className="mx-auto flex min-h-svh max-w-5xl items-center justify-center px-5 pb-16 pt-28 text-center md:px-10 md:pt-24">
        <div className="max-w-3xl">
          <p className="mb-5 font-title text-sm font-extrabold tracking-[0.14em] text-primary">
            YOUR LITTLE PHOTO ARCHIVE
          </p>
          <h1 className="title">
            把日常拍成
            <span className="block">一份可愛收藏</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-sm font-semibold text-foreground/65 md:text-lg">
            相機先把照片上傳成私人草稿，螢幕顯示一次性領取碼
          </p>
          <p className="text-sm font-semibold text-foreground/65 md:text-lg">
            掃描機身 NFC，在自己的手機後製、下載，再決定是否公開
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 md:flex-row">
            <Link href="/create" className={cn(buttonVariants(), "w-full md:w-auto")}>
              輸入領取碼
              <IconArrowRight aria-hidden="true" />
            </Link>
            <Link href="/gallery" className={cn(buttonVariants({ variant: "secondary" }), "w-full md:w-auto")}>
              瀏覽公開相簿
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-bold text-foreground">
            {highlights.map((label) => (
              <li key={label} className="flex items-center gap-2">
                <span className="size-2 rounded-pill bg-accent" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
