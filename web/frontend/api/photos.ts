import { apiClient } from "@/api/common";
import type { PhotoListResponse } from "@/api/types";

export async function listPhotos() {
  const { data } = await apiClient.get<PhotoListResponse>("/photos");
  return data;
}
