import Image from "next/image";
import { IconDownload } from "@tabler/icons-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Photo } from "@/api/types";
import { cn } from "@/lib/utils";

const backgroundClasses = [
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-foreground/10",
];

function formatPhotoDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDownloadUrl(imageUrl: string) {
  return `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}download=1`;
}

type PhotoCardProps = {
  photo: Photo;
  eager?: boolean;
};

export function PhotoCard({ photo, eager = false }: PhotoCardProps) {
  const colorIndex = photo.id
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  const downloadUrl = getDownloadUrl(photo.imageUrl);

  return (
    <article className="group min-w-0">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className={`gallery-photo-trigger relative block aspect-square w-full cursor-pointer overflow-hidden rounded-primary text-left shadow-sm outline-none transition-all duration-600 focus-visible:ring-4 focus-visible:ring-primary/35 motion-reduce:transition-none ${backgroundClasses[colorIndex % backgroundClasses.length]}`}
            aria-label={`放大查看「${photo.title}」`}
          >
            <Image
              src={photo.imageUrl}
              alt={photo.title}
              fill
              loading={eager ? "eager" : "lazy"}
              unoptimized={
                photo.imageUrl.startsWith("data:") ||
                photo.imageUrl.startsWith("http")
              }
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="gallery-photo-image object-cover"
            />
          </button>
        </DialogTrigger>

        <DialogContent className="w-fit max-w-[calc(100vw-1.5rem)] bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{photo.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {formatPhotoDate(photo.createdAt)}公開的照片
          </DialogDescription>
          {/* Public API images are intentionally rendered without Next.js optimization. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="block h-auto max-h-[90svh] w-auto max-w-[calc(100vw-1.5rem)] rounded-primary object-contain"
          />
        </DialogContent>
      </Dialog>

      <div className="flex items-start justify-between gap-3 px-1 pt-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-title text-xl font-bold text-primary">
            {photo.title}
          </h3>
          <p className="mt-1 text-xs font-bold text-foreground/65">
            {formatPhotoDate(photo.createdAt)}
          </p>
        </div>
        <a
          href={downloadUrl}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}
          aria-label={`下載「${photo.title}」`}
          title="下載照片"
        >
          <IconDownload aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
