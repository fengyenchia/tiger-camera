"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { IconPhoto } from "@tabler/icons-react";

import { PhotoCard } from "@/components/gallery/photo-card";
import { UploadPanel } from "@/components/gallery/upload-panel";
import { createPhoto, listPhotos, permanentlyDeletePhoto } from "@/api/photos";
import type { Photo } from "@/api/types";

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("讀取照片失敗"));
    reader.readAsDataURL(file);
  });
}

export function GalleryClient() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("準備好收藏下一張照片");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    try {
      const result = await listPhotos();
      setPhotos(result.photos);
    } catch {
      setMessage("目前讀不到相簿，請稍後再試一次");
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "image/jpeg") {
      setMessage("目前只接受 JPEG 照片");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setMessage("照片請控制在 8 MB 以內");
      return;
    }

    setIsUploading(true);
    setMessage("正在把照片放進小相簿…");
    try {
      const dataUrl = await fileToDataUrl(file);
      await createPhoto({
        title: file.name.replace(/\.jpe?g$/i, "") || "今天的照片",
        originalUrl: dataUrl,
        processedUrl: dataUrl,
        filterPreset: "Original",
      });
      setMessage("照片已加入示範相簿");
      await loadPhotos();
    } catch {
      setMessage("上傳沒有完成，照片仍留在你的裝置上");
    } finally {
      setIsUploading(false);
    }
  }

  async function removePhoto(photo: Photo) {
    try {
      await permanentlyDeletePhoto(photo.id);
      setMessage(`「${photo.title}」已刪除`);
      await loadPhotos();
    } catch {
      setMessage("刪除沒有完成，照片仍然保留");
    }
  }

  return (
    <>
      <header className="grid gap-8 border-b border-primary/35 pb-10 md:grid-cols-[1fr_24rem] md:items-end">
        <div>
          <p className="mb-4 text-sm font-extrabold tracking-[0.16em] text-primary">PRIVATE PHOTO LIBRARY</p>
          <h1 className="font-display font-bold tracking-[-0.04em] text-primary text-5xl">
            我的照片收藏
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-muted-foreground">
            上傳測試 JPEG、查看照片，或按一次直接刪除。目前仍是本機記憶體示範模式。
          </p>
          <p className="mt-3 min-h-6 text-sm font-extrabold text-primary-strong" aria-live="polite">
            {message}
          </p>
        </div>

        <UploadPanel
          inputRef={fileInputRef}
          isUploading={isUploading}
          onChange={handleUpload}
          onSelect={() => fileInputRef.current?.click()}
        />
      </header>

      <section className="pt-10" aria-labelledby="gallery-heading">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h2 id="gallery-heading" className="text-2xl font-black tracking-tight">
            最近收藏
          </h2>
          <span className="rounded-pill bg-pink px-4 py-2 text-sm font-extrabold text-primary-strong">
            {photos.length} photos
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-x-5 gap-y-10 md:grid-cols-3" aria-label="正在讀取照片">
            {[0, 1, 2].map((item) => (
              <div key={item} className="aspect-[4/5] animate-pulse rounded-primary bg-pink motion-reduce:animate-none" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-primary border border-dashed border-primary/45 bg-card p-8 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-yellow text-primary">
                <IconPhoto size={30} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-black">相簿還空空的</h3>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">先選一張 JPEG，開始收藏。</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-10 md:grid-cols-3">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                eager={index === 0}
                onDelete={() => void removePhoto(photo)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
