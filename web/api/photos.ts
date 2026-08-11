import { apiClient } from "@/api/common";
import type { CreatePhotoInput, Photo, PhotoListResponse } from "@/api/types";

export async function listPhotos() {
  const { data } = await apiClient.get<PhotoListResponse>("/photos");
  return data;
}

export async function createPhoto(input: CreatePhotoInput) {
  const { data } = await apiClient.post<{ photo: Photo }>("/photos", input);
  return data.photo;
}

export async function permanentlyDeletePhoto(id: string) {
  await apiClient.delete("/photos", { data: { id } });
}
