"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  IconCheck,
  IconEdit,
  IconLogin,
  IconLogout,
  IconRefresh,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import {
  adminTokenKey,
  deleteAdminPhoto,
  loginAdmin,
  logoutAdmin,
  renameAdminPhoto,
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
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
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

  function startRenaming(photo: Photo) {
    setEditingPhotoId(photo.id);
    setEditingTitle(photo.title);
  }

  function cancelRenaming() {
    setEditingPhotoId(null);
    setEditingTitle("");
  }

  async function handleRenamePhoto(event: FormEvent<HTMLFormElement>, photo: Photo) {
    event.preventDefault();
    const title = editingTitle.trim();
    if (!title) {
      setMessage("照片名稱不能空白");
      return;
    }

    setBusy(true);
    try {
      const updatedPhoto = await renameAdminPhoto(photo.id, title);
      setPhotos((current) =>
        current.map((item) => (item.id === photo.id ? updatedPhoto : item)),
      );
      cancelRenaming();
      setMessage(`已將照片重新命名為「${updatedPhoto.title}」`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        logoutAdmin();
        setAuthenticated(false);
        setPhotos([]);
        cancelRenaming();
        setMessage("登入已過期，請重新登入");
      } else if (isAxiosError(error) && error.response?.status === 405) {
        setMessage("Backend 尚未部署重新命名 API，請先部署最新版 Backend");
      } else if (isAxiosError(error) && error.response?.status === 404) {
        setMessage("這張公開照片不存在，請重新整理相簿");
      } else {
        setMessage("重新命名失敗，請稍後再試一次");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    logoutAdmin();
    setAuthenticated(false);
    setPhotos([]);
    cancelRenaming();
    setMessage("已登出");
  }

  if (!authenticated) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>管理員登入</CardTitle>
          {/* <CardDescription>JWT 只保存在這台瀏覽器的 localStorage，有效 30 分鐘。</CardDescription> */}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleLogin(event)}>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="帳號" autoComplete="username" />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密碼" type="password" autoComplete="current-password" />
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
          <CardDescription>可重新命名；按下刪除即永久刪除，不會出現第二次確認</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {photos.length === 0 && <p className="text-sm font-bold text-foreground/60">目前沒有公開照片</p>}
          {photos.map((photo) => (
            <div key={photo.id} className="flex flex-col gap-4 rounded-primary border border-primary/25 p-4 md:flex-row md:items-center md:justify-between">
              {editingPhotoId === photo.id ? (
                <form
                  className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center"
                  onSubmit={(event) => void handleRenamePhoto(event, photo)}
                >
                  <Input
                    aria-label="照片名稱"
                    autoFocus
                    maxLength={80}
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" type="submit" disabled={busy || !editingTitle.trim()}>
                      {busy ? <IconRefresh className="animate-spin" /> : <IconCheck />}
                      儲存
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={cancelRenaming}>
                      <IconX />取消
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{photo.title}</p>
                  <p className="text-xs font-bold text-foreground/60">{new Date(photo.createdAt).toLocaleString("zh")}</p>
                </div>
              )}
              {editingPhotoId !== photo.id && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => startRenaming(photo)}>
                    <IconEdit />重新命名
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => void handleDeletePhoto(photo)}>
                    <IconTrash />永久刪除
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
