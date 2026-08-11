import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const highlights = ["原圖不覆寫", "私人相簿", "離線可下載"];

export default function Home() {
  return (
    <main id="main-content">
      <section className="mx-auto flex min-h-svh max-w-5xl items-center justify-center px-5 pb-16 pt-28 text-center md:px-10 md:pt-24">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-extrabold tracking-[0.14em] text-primary">
            YOUR LITTLE PHOTO ARCHIVE
          </p>
          <h1 className="font-display text-5xl font-black leading-[1.25] tracking-[-0.04em] text-primary md:text-[5.25rem]">
            把日常拍成
            <span className="block">一份可愛收藏</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-sm font-semibold text-muted-foreground md:text-lg">
            Tiger Camera 把相機拍下的 JPEG 交給手機後製
          </p>
          <p className="font-semibold text-muted-foreground text-sm md:text-lg">
            再將原圖與完成照片安全保存到你的私人網站
          </p>

          <Link href="/gallery" className={cn(buttonVariants(), "mt-8 w-full md:w-auto")}>
            打開我的相簿
            <IconArrowRight aria-hidden="true" />
          </Link>

          <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-bold text-foreground">
            {highlights.map((label) => (
              <li key={label} className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-yellow" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
