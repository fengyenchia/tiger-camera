"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  IconCopy,
  IconDeviceCameraPhone,
  IconLogin,
  IconLogout,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";

import {
  adminTokenKey,
  createAdminDevice,
  deleteAdminPhoto,
  listAdminDevices,
  loginAdmin,
  logoutAdmin,
  updateAdminDevice,
} from "@/api/admin";
import { listPhotos } from "@/api/photos";
import type { AdminDevice, Photo } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceName, setDeviceName] = useState("Tiger Camera S3");
  const [credential, setCredential] = useState<string | null>(null);
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("只有管理員可以進行永久刪除與裝置管理");

  const loadData = useCallback(async () => {
    const [nextDevices, nextPhotos] = await Promise.all([
      listAdminDevices(),
      listPhotos().then((result) => result.photos),
    ]);
    setDevices(nextDevices);
    setPhotos(nextPhotos);
  }, []);

  useEffect(() => {
    if (!window.localStorage.getItem(adminTokenKey)) return;
    const timer = window.setTimeout(() => {
      void loadData()
        .then(() => setAuthenticated(true))
        .catch(() => {
          logoutAdmin();
          setAuthenticated(false);
          setMessage("登入已過期，請重新登入");
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await loginAdmin(username.trim(), password);
      setPassword("");
      setAuthenticated(true);
      await loadData();
      setMessage("管理員登入成功");
    } catch {
      setMessage("帳號或密碼錯誤，或 Backend 尚未設定管理員環境變數");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateDevice() {
    setBusy(true);
    try {
      const result = await createAdminDevice(deviceName.trim());
      setCredential(result.credential);
      await loadData();
      setMessage("裝置已建立；credential 只會顯示這一次，請立即保存到 ESP32 secrets");
    } catch {
      setMessage("裝置建立失敗");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeviceStatus(device: AdminDevice) {
    setBusy(true);
    try {
      await updateAdminDevice(device.id, device.status === "active" ? "revoked" : "active");
      await loadData();
      setMessage(device.status === "active" ? "裝置憑證已撤銷" : "裝置已重新啟用");
    } catch {
      setMessage("裝置狀態更新失敗");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePhoto(photo: Photo) {
    setBusy(true);
    try {
      await deleteAdminPhoto(photo.id);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setMessage(`已永久刪除「${photo.title}」；沒有垃圾桶或還原功能`);
    } catch {
      setMessage("永久刪除未完成，cleanup 會重試待刪物件");
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    logoutAdmin();
    setAuthenticated(false);
    setDevices([]);
    setPhotos([]);
    setCredential(null);
    setMessage("已登出");
  }

  if (!authenticated) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>管理員登入</CardTitle>
          <CardDescription>JWT 只保存在這台瀏覽器的 localStorage，有效 30 分鐘。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleLogin(event)}>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="管理員帳號" autoComplete="username" />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="管理員密碼" type="password" autoComplete="current-password" />
            <Button className="w-full" type="submit" disabled={busy || !username.trim() || !password}>
              {busy ? <IconRefresh className="animate-spin" /> : <IconLogin />}
              登入
            </Button>
            <p className="text-sm font-bold text-primary" aria-live="polite">{message}</p>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-primary/30 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 font-title text-sm font-extrabold tracking-[0.14em] text-primary">ADMIN CONSOLE</p>
          <h1 className="subTitle">相機與相簿管理</h1>
          <p className="mt-3 text-sm font-bold text-primary" aria-live="polite">{message}</p>
        </div>
        <Button variant="ghost" onClick={handleLogout}><IconLogout />登出</Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>建立相機裝置</CardTitle>
            <CardDescription>建立後只顯示一次 device credential。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} maxLength={80} />
            <Button onClick={() => void handleCreateDevice()} disabled={busy || !deviceName.trim()}>
              <IconDeviceCameraPhone />建立裝置
            </Button>
            {credential && (
              <div className="rounded-primary bg-primary/10 p-4">
                <p className="break-all font-mono text-sm font-bold">{credential}</p>
                <Button className="mt-3" size="sm" variant="ghost" onClick={() => void navigator.clipboard.writeText(credential)}>
                  <IconCopy />複製 credential
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>已註冊裝置</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {devices.length === 0 && <p className="text-sm font-bold text-foreground/60">尚未建立裝置</p>}
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between gap-3 rounded-primary border border-primary/25 p-4">
                <div><p className="font-extrabold">{device.name}</p><p className="text-xs font-bold text-foreground/60">{device.status}</p></div>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void handleDeviceStatus(device)}>
                  {device.status === "active" ? "撤銷" : "啟用"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>公開照片</CardTitle>
          <CardDescription>按下刪除即永久刪除，不會出現第二次確認。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {photos.length === 0 && <p className="text-sm font-bold text-foreground/60">目前沒有公開照片</p>}
          {photos.map((photo) => (
            <div key={photo.id} className="flex items-center justify-between gap-4 rounded-primary border border-primary/25 p-4">
              <div className="min-w-0"><p className="truncate font-extrabold">{photo.title}</p><p className="text-xs font-bold text-foreground/60">{new Date(photo.createdAt).toLocaleString("zh-TW")}</p></div>
              <Button size="sm" disabled={busy} onClick={() => void handleDeletePhoto(photo)}><IconTrash />永久刪除</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
