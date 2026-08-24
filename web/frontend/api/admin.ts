import { adminApiClient, apiClient } from "@/api/common";
import type { Photo } from "@/api/types";

export const adminTokenKey = "tiger_camera_admin_token";

export async function loginAdmin(username: string, password: string) {
  const { data } = await apiClient.post<{ token: string; expiresIn: number }>(
    "/admin/login",
    { username, password },
  );
  window.localStorage.setItem(adminTokenKey, data.token);
  return data;
}

export function logoutAdmin() {
  window.localStorage.removeItem(adminTokenKey);
}

export async function deleteAdminPhoto(id: string) {
  await adminApiClient.delete(`/photos/${id}`);
}

export type { Photo };
