"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBrandGithub } from "@tabler/icons-react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首頁" },
  { href: "/gallery", label: "相簿" },
];

export function SiteNavbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const upwardDistance = useRef(0);
  const downwardDistance = useRef(0);
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (currentY) => {
    const previousY = scrollY.getPrevious() ?? 0;
    const difference = currentY - previousY;

    if (currentY < 72) {
      setIsVisible(true);
      upwardDistance.current = 0;
      downwardDistance.current = 0;
    } else if (difference > 0) {
      downwardDistance.current += difference;
      upwardDistance.current = 0;
      if (downwardDistance.current > 18) setIsVisible(false);
    } else if (difference < 0) {
      upwardDistance.current += Math.abs(difference);
      downwardDistance.current = 0;
      if (upwardDistance.current > 24) setIsVisible(true);
    }
  });

  return (
    <>
      <Link
        href="#main-content"
        className="sr-only z-[60] rounded-pill bg-foreground px-4 py-3 text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        跳到主要內容
      </Link>
      <motion.header
        initial={false}
        animate={{ y: isVisible || shouldReduceMotion ? "0%" : "-120%" }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
        className="fixed inset-x-0 top-0 z-50 px-0 py-0 md:px-5 md:py-3"
      >
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between border-b border-primary/35 bg-background px-4 md:rounded-pill md:border md:px-5">
          <Link
            href="/"
            className="group flex min-h-11 items-center gap-2 rounded-pill font-extrabold text-primary transition-all duration-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
          >
            <span className="grid size-12 place-items-center rounded-full bg-destructive-foreground transition-all duration-600">
              <Image
                src="/images/logo.png"
                alt=""
                width={40}
                height={40}
                className="transition-all duration-600 group-hover:scale-110"
              />
            </span>
            <span className="hidden md:inline">Tiger Camera</span>
          </Link>

          <div className="flex items-center gap-1 rounded-pill bg-pink/70 p-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-pill px-4 text-sm font-extrabold transition-all duration-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-primary-strong hover:bg-card hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <Link
            href="https://github.com/fengyenchia/tiger-camera"
            target="_blank"
            rel="noreferrer"
            aria-label="在 GitHub 查看 Tiger Camera（另開新視窗）"
            className="group flex min-h-11 items-center gap-2 rounded-pill font-extrabold text-primary transition-all duration-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
          >
            <span className="hidden md:inline">GitHub</span>
            <span className="grid size-11 place-items-center rounded-full bg-destructive-foreground text-primary transition-all duration-600 group-hover:scale-105 group-hover:bg-primary group-hover:text-yellow">
              <IconBrandGithub size={22} stroke={2} aria-hidden="true" />
            </span>
          </Link>
        </nav>
      </motion.header>
    </>
  );
}
