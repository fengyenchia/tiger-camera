import Link from "next/link";
import { IconArrowUpRight, IconBrandGithub } from "@tabler/icons-react";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mx-4 mb-4 rounded-primary bg-primary text-primary-foreground md:mx-6 md:mb-6">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 md:grid-cols-[1fr_auto] md:items-end md:px-10">
        <div>
          <div className="group flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-destructive-foreground">
              <Image
                src="/images/logo.png"
                alt=""
                width={40}
                height={40}
                className="transition-all duration-600 group-hover:scale-110"
              />
            </span>
            <p className="font-display text-3xl font-bold">
              Tiger Camera
            </p>
          </div>
          <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-primary-foreground/80">
            一台把日常拍下來、在手機完成復古後製，再存進私人相簿的小相機
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm font-extrabold">
          <Link
            className="rounded-pill px-4 py-3 transition-all duration-600 hover:bg-primary-foreground hover:text-primary"
            href="/"
          >
            首頁
          </Link>
          <Link
            className="rounded-pill px-4 py-3 transition-all duration-600 hover:bg-primary-foreground hover:text-primary"
            href="/gallery"
          >
            相簿
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-pill px-4 py-3 transition-all duration-600 hover:bg-primary-foreground hover:text-primary"
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
      <div className="mx-6 flex flex-col gap-2 border-t border-primary-foreground/30 py-5 text-xs font-bold text-primary-foreground/70 md:mx-10 md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Tiger Camera</p>
        <p>Private gallery · Original JPEG preserved</p>
      </div>
    </footer>
  );
}
