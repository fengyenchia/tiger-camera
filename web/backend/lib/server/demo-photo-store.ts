import type { CreatePhotoInput, Photo } from "@/lib/types";

const now = Date.now();

let photos: Photo[] = [
  {
    id: "demo-sunroom",
    title: "窗邊的小日子",
    originalUrl: "/samples/photo-sunroom.svg",
    processedUrl: "/samples/photo-sunroom.svg",
    createdAt: new Date(now - 1000 * 60 * 42).toISOString(),
    filterPreset: "Tiger Film",
  },
  {
    id: "demo-picnic",
    title: "午後野餐",
    originalUrl: "/samples/photo-picnic.svg",
    processedUrl: "/samples/photo-picnic.svg",
    createdAt: new Date(now - 1000 * 60 * 60 * 25).toISOString(),
    filterPreset: "Baby Tiger",
  },
  {
    id: "demo-night",
    title: "晚安城市",
    originalUrl: "/samples/photo-night.svg",
    processedUrl: "/samples/photo-night.svg",
    createdAt: new Date(now - 1000 * 60 * 60 * 50).toISOString(),
    filterPreset: "Night Hunter",
  },
];

export function getDemoPhotos() {
  return photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addDemoPhoto(input: CreatePhotoInput) {
  const photo: Photo = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  photos = [photo, ...photos];
  return photo;
}
