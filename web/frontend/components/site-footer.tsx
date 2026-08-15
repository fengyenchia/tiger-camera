import Link from "next/link";
import { IconArrowUpRight, IconBrandGithub } from "@tabler/icons-react";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mx-4 mb-4 rounded-primary bg-primary text-background md:mx-6 md:mb-6">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 md:grid-cols-[1fr_auto] md:items-end md:px-10">
        <div>
          <div className="group flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-pill bg-background">
              <Image
                src="/images/logo.png"
                alt=""
                width={40}
                height={40}
                className="transition-all duration-600 group-hover:scale-110"
              />
            </span>
            <p className="font-title text-3xl font-bold">
              Tiger Camera
            </p>
          </div>
          <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-background/80">
            拍照後用 NFC 與領取碼帶走照片，在自己的手機後製，再自由選擇是否公開
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm font-extrabold">
          <Link
            className="rounded-pill px-4 py-3 transition-all duration-600 hover:bg-background hover:text-primary"
            href="/"
          >
            首頁
          </Link>
          <Link
            className="rounded-pill px-4 py-3 transition-all duration-600 hover:bg-background hover:text-primary"
            href="/create"
          >
            後製
          </Link>
          <Link
            className="rounded-pill px-4 py-3 transition-all duration-600 hover:bg-background hover:text-primary"
            href="/gallery"
          >
            相簿
          </Link>
          <Link
            className="rounded-pill px-4 py-3 transition-all duration-600 hover:bg-background hover:text-primary"
            href="/admin"
          >
            管理
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-pill px-4 py-3 transition-all duration-600 hover:bg-background hover:text-primary"
            href="https://github.com/fengyenchia/tiger-camera"
            target="_blank"
            rel="noreferrer"
          >
            <IconBrandGithub size={19} aria-hidden="true" />
            GitHub
            <IconArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="mx-6 flex flex-col gap-2 border-t border-background/30 py-5 text-xs font-bold text-background/70 md:mx-10 md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Tiger Camera</p>
        <p>Public gallery · Publishing is optional</p>
      </div>
    </footer>
  );
}
