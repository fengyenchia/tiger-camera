"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconPhoto } from "@tabler/icons-react";

import { PhotoCard } from "@/app/gallery/_components/photo-card";
import { buttonVariants } from "@/components/ui/button";
import { listPhotos } from "@/api/photos";
import type { Photo } from "@/api/types";
import { cn } from "@/lib/utils";

export function GalleryClient() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("這裡只顯示選擇公開的照片");

  useEffect(() => {
    let isCurrent = true;
    void listPhotos()
      .then((result) => {
        if (isCurrent) setPhotos(result.photos);
      })
      .catch(() => {
        if (isCurrent) setMessage("目前讀不到相簿，請稍後再試一次");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <>
      <header className="grid gap-8 border-b border-primary/35 pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="mb-4 font-title text-sm font-extrabold tracking-[0.16em] text-primary">PUBLIC PHOTO GALLERY</p>
          <h1 className="subTitle">
            大家都能看的相簿
          </h1>
          <p className="mt-5 max-w-5xl text-base font-semibold leading-7 text-foreground/65">
            領取者在自己的手機完成後製，並勾選「公開到網站相簿」後，照片才會出現在這裡
          </p>
          <p className="mt-3 min-h-6 text-sm font-extrabold text-primary" aria-live="polite">
            {message}
          </p>
        </div>
      </header>

      <section className="pt-10" aria-labelledby="gallery-heading">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h2 id="gallery-heading" className="text-2xl font-black tracking-tight">
            最近收藏
          </h2>
          <span className="rounded-pill bg-secondary/55 px-4 py-2 text-sm font-extrabold text-primary">
            {photos.length} photos
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-x-5 gap-y-10 md:grid-cols-3" aria-label="正在讀取照片">
            {[0, 1, 2].map((item) => (
              <div key={item} className="aspect-4/5 animate-pulse rounded-primary bg-secondary/45 motion-reduce:animate-none" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-primary border border-dashed border-primary/35 bg-background p-8 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-pill bg-accent text-primary">
                <IconPhoto size={30} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-black">相簿還空空的</h3>
              <p className="mt-2 text-sm font-semibold text-foreground/65">完成後製後，再選擇是否公開</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-10 md:grid-cols-3">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                eager={index === 0}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
