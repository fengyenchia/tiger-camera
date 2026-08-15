import { adminApiClient, apiClient } from "@/api/common";
import type { AdminDevice, Photo } from "@/api/types";

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

export async function listAdminDevices() {
  const { data } = await adminApiClient.get<{ devices: AdminDevice[] }>("/admin/devices");
  return data.devices;
}

export async function createAdminDevice(name: string) {
  const { data } = await adminApiClient.post<{ device: AdminDevice; credential: string }>(
    "/admin/devices",
    { name },
  );
  return data;
}

export async function updateAdminDevice(id: string, status: AdminDevice["status"]) {
  const { data } = await adminApiClient.patch<{ device: AdminDevice }>(
    `/admin/devices/${id}`,
    { status },
  );
  return data.device;
}

export async function deleteAdminPhoto(id: string) {
  await adminApiClient.delete(`/photos/${id}`);
}

export type { AdminDevice, Photo };
