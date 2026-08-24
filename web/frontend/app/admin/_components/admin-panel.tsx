"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  IconLogin,
  IconLogout,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";

import {
  adminTokenKey,
  deleteAdminPhoto,
  loginAdmin,
  logoutAdmin,
} from "@/api/admin";
import { listPhotos } from "@/api/photos";
import type { Photo } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("只有管理員可以永久刪除公開照片");

  const loadData = useCallback(async () => {
    const result = await listPhotos();
    setPhotos(result.photos);
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
    setPhotos([]);
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
          <h1 className="subTitle">相簿管理</h1>
          <p className="mt-3 text-sm font-bold text-primary" aria-live="polite">{message}</p>
        </div>
        <Button variant="ghost" onClick={handleLogout}><IconLogout />登出</Button>
      </header>

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
