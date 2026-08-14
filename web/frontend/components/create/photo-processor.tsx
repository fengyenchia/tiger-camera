"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCloudUpload,
  IconDownload,
  IconKey,
  IconPhoto,
  IconRefresh,
} from "@tabler/icons-react";

import { claimDraft, publishDraft } from "@/api/drafts";
import type { ClaimedDraft } from "@/api/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_TEXTS,
  processPhoto,
  type FilterPreset,
  type ProcessingOptions,
} from "@/lib/photo-processing/process-photo";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: { value: FilterPreset; label: string }[] = [
  { value: "none", label: "無濾鏡" },
  { value: "tiger-film", label: "Tiger Film" },
  { value: "jungle-green", label: "Jungle Green" },
  { value: "baby-tiger", label: "Baby Tiger" },
  { value: "night-hunter", label: "Night Hunter" },
];

function toLocalDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("讀取照片失敗"));
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function randomDefaultText() {
  return DEFAULT_TEXTS[Math.floor(Math.random() * DEFAULT_TEXTS.length)];
}

const initialOptions: ProcessingOptions = {
  frameEnabled: true,
  timestampEnabled: true,
  textEnabled: false,
  textMode: "default",
  customText: "",
  defaultText: DEFAULT_TEXTS[0],
  filterPreset: "tiger-film",
  capturedAt: toLocalDateTime(new Date()),
};

type ToggleOptionProps = {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
};

function ToggleOption({ checked, description, label, onChange }: ToggleOptionProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-secondary border border-primary/25 bg-background p-4 transition-all duration-600 hover:border-primary/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-5 accent-primary"
      />
      <span>
        <span className="block font-extrabold">{label}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function PhotoProcessor() {
  const [claimCode, setClaimCode] = useState("");
  const [draft, setDraft] = useState<ClaimedDraft | null>(null);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [options, setOptions] = useState(initialOptions);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("今天的照片");
  const [publishPublicly, setPublishPublicly] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState("掃描機身 NFC 後，輸入相機螢幕上的領取碼");

  const filterLabel = useMemo(
    () => FILTER_OPTIONS.find((item) => item.value === options.filterPreset)?.label ?? "無濾鏡",
    [options.filterPreset],
  );

  useEffect(() => {
    if (!originalBlob) return;
    let current = true;

    const timer = window.setTimeout(() => {
      setIsProcessing(true);
      setMessage("正在更新後製預覽…");
      const source = new File([originalBlob], "claimed-photo", {
        type: originalBlob.type || "image/jpeg",
      });

      void processPhoto(source, options)
        .then((blob) => {
          if (!current) return;
          const nextUrl = URL.createObjectURL(blob);
          setProcessedBlob(blob);
          setPreviewUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return nextUrl;
          });
          setMessage("預覽完成，可以下載或選擇公開");
        })
        .catch((error: unknown) => {
          if (current) {
            setMessage(error instanceof Error ? error.message : "這張照片無法完成後製");
          }
        })
        .finally(() => {
          if (current) setIsProcessing(false);
        });
    }, 180);

    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [originalBlob, options]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function updateOptions(patch: Partial<ProcessingOptions>) {
    setOptions((current) => ({ ...current, ...patch }));
  }

  async function handleClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = claimCode.replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (!/^[A-Z0-9]{6,8}$/.test(normalizedCode)) {
      setMessage("請輸入相機螢幕上的 6～8 位英數領取碼");
      return;
    }

    setIsClaiming(true);
    setMessage("正在領取私人照片…");
    try {
      const claimed = await claimDraft(normalizedCode);
      const response = await fetch(claimed.originalUrl, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${claimed.claimToken}` },
      });
      if (!response.ok) throw new Error("無法讀取私人原圖");
      const blob = await response.blob();
      if (!blob.size) throw new Error("私人原圖內容為空");

      setDraft(claimed);
      setOriginalBlob(blob);
      setTitle(`Tiger Camera ${normalizedCode}`);
      setOptions((current) => ({
        ...current,
        capturedAt: toLocalDateTime(claimed.capturedAt),
      }));
      window.sessionStorage.setItem(
        `tiger_camera_claim_${claimed.id}`,
        claimed.claimToken,
      );
      setMessage("照片已領取，只會在你選擇公開後出現在相簿");
    } catch {
      setMessage("領取碼錯誤、已使用或已過期，請確認相機螢幕");
    } finally {
      setIsClaiming(false);
    }
  }

  async function handlePublish() {
    if (!draft || !processedBlob || !publishPublicly) return;
    if (options.textEnabled && options.textMode === "custom" && !options.customText.trim()) {
      setMessage("請輸入文字，或改選預設文字／關閉文字");
      return;
    }

    setIsPublishing(true);
    setMessage("正在公開照片…");
    try {
      const processedUrl = await blobToDataUrl(processedBlob);
      await publishDraft(draft.id, draft.claimToken, {
        title: title.trim() || "今天的照片",
        processedUrl,
        filterPreset: filterLabel,
      });
      setMessage("已加入示範公開相簿；正式版會保存到 R2 與 Neon");
    } catch {
      setMessage("公開沒有完成，仍可先下載照片後再重試");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <p className="mb-4 text-sm font-extrabold tracking-[0.14em] text-primary">CLAIM YOUR PHOTO</p>
        <h1 className="font-display text-4xl font-black tracking-[-0.04em] text-primary md:text-6xl">
          輸入領取碼，帶走你的照片
        </h1>
        <p className="mt-5 text-sm font-semibold leading-7 text-muted-foreground md:text-lg">
          相機會透過網路先把原圖保存成私人草稿。掃描機身 NFC 開啟此頁，再輸入螢幕上的領取碼，就能在自己的手機後製與下載。
        </p>
      </header>

      <ol className="grid gap-3 md:grid-cols-4" aria-label="照片領取流程">
        {["拍照並等待上傳", "掃描機身 NFC", "輸入螢幕領取碼", "後製、下載或公開"].map((label, index) => (
          <li key={label} className="rounded-secondary border border-primary/30 bg-card p-4 text-sm font-extrabold">
            <span className="mr-2 text-primary">{index + 1}.</span>
            {label}
          </li>
        ))}
      </ol>

      {!draft && (
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <span className="mb-3 grid size-12 place-items-center rounded-full bg-yellow text-primary">
              <IconKey aria-hidden="true" />
            </span>
            <CardTitle>領取私人草稿</CardTitle>
            <CardDescription>
              領取碼只對應一張照片，逾時或成功領取後即失效。Demo 可輸入 TIGER1。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleClaim(event)}>
              <label className="block text-sm font-extrabold">
                6～8 位領取碼
                <input
                  autoCapitalize="characters"
                  autoComplete="one-time-code"
                  inputMode="text"
                  maxLength={8}
                  value={claimCode}
                  onChange={(event) => setClaimCode(event.target.value.toUpperCase())}
                  placeholder="例如 TIGER1"
                  className="mt-2 h-14 w-full rounded-small border border-primary/30 bg-background px-4 text-center text-xl font-black tracking-[0.2em] uppercase outline-none transition-all duration-600 placeholder:tracking-normal focus:border-primary focus:ring-4 focus:ring-ring/20"
                />
              </label>
              <Button className="w-full" type="submit" disabled={isClaiming}>
                {isClaiming ? <IconRefresh className="animate-spin motion-reduce:animate-none" /> : <IconPhoto />}
                {isClaiming ? "領取中" : "領取我的照片"}
              </Button>
              <p className="min-h-6 text-sm font-extrabold leading-6 text-primary-strong" aria-live="polite">
                {message}
              </p>
            </form>
          </CardContent>
        </Card>
      )}

      {draft && (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] md:items-start">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>你的私人照片</CardTitle>
              <CardDescription>
                領取後仍是私人狀態；下載不等於公開，只有勾選公開才會加入相簿。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="overflow-hidden rounded-secondary bg-muted">
                  {/* Blob URLs cannot use the Next.js image optimizer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="後製照片預覽" className="mx-auto max-h-[68svh] w-full object-contain" />
                </div>
              ) : (
                <div className="grid min-h-80 place-items-center rounded-secondary bg-muted">
                  <IconRefresh className="animate-spin text-primary motion-reduce:animate-none" aria-label="正在產生預覽" />
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="ghost"
                  disabled={!originalBlob}
                  onClick={() =>
                    originalBlob &&
                    downloadBlob(
                      originalBlob,
                      `${title}-original.${draft.demoMode ? "svg" : "jpg"}`,
                    )
                  }
                >
                  <IconDownload aria-hidden="true" />
                  下載原圖
                </Button>
                <Button
                  disabled={!processedBlob || isProcessing}
                  onClick={() => processedBlob && downloadBlob(processedBlob, `${title}-processed.jpg`)}
                >
                  {isProcessing ? <IconRefresh className="animate-spin motion-reduce:animate-none" /> : <IconDownload />}
                  下載後製圖
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>後製內容</CardTitle>
                <CardDescription>四項可以任意複選，也可以全部關閉。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ToggleOption
                  label="拍立得框"
                  description="增加米白邊框與較寬的下方留白"
                  checked={options.frameEnabled}
                  onChange={(frameEnabled) => updateOptions({ frameEnabled })}
                />
                <ToggleOption
                  label="日期"
                  description="顯示台北時間，可自行調整"
                  checked={options.timestampEnabled}
                  onChange={(timestampEnabled) => updateOptions({ timestampEnabled })}
                />
                {options.timestampEnabled && (
                  <input
                    aria-label="照片日期與時間"
                    type="datetime-local"
                    value={options.capturedAt}
                    onChange={(event) => updateOptions({ capturedAt: event.target.value })}
                    className="h-11 w-full rounded-small border border-primary/30 bg-background px-3 text-sm font-bold outline-none transition-all duration-600 focus:border-primary focus:ring-4 focus:ring-ring/20"
                  />
                )}
                <ToggleOption
                  label="文字"
                  description="自訂一句話，或使用隨機預設文字"
                  checked={options.textEnabled}
                  onChange={(textEnabled) => updateOptions({ textEnabled })}
                />
                {options.textEnabled && (
                  <div className="space-y-3 rounded-secondary bg-primary-soft/45 p-4">
                    <div className="flex gap-4 text-sm font-extrabold">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="text-mode"
                          checked={options.textMode === "custom"}
                          onChange={() => updateOptions({ textMode: "custom" })}
                          className="size-4 accent-primary"
                        />
                        自訂
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="text-mode"
                          checked={options.textMode === "default"}
                          onChange={() => updateOptions({ textMode: "default" })}
                          className="size-4 accent-primary"
                        />
                        預設
                      </label>
                    </div>
                    {options.textMode === "custom" ? (
                      <input
                        value={options.customText}
                        maxLength={40}
                        placeholder="輸入想寫在照片上的文字"
                        onChange={(event) => updateOptions({ customText: event.target.value })}
                        className="h-11 w-full rounded-small border border-primary/30 bg-card px-3 text-sm font-bold outline-none transition-all duration-600 focus:border-primary focus:ring-4 focus:ring-ring/20"
                      />
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-extrabold text-primary">{options.defaultText}</span>
                        <Button size="sm" variant="ghost" onClick={() => updateOptions({ defaultText: randomDefaultText() })}>
                          <IconRefresh aria-hidden="true" />
                          換一句
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <label className="block rounded-secondary border border-primary/25 bg-background p-4">
                  <span className="block font-extrabold">復古濾鏡</span>
                  <select
                    value={options.filterPreset}
                    onChange={(event) => updateOptions({ filterPreset: event.target.value as FilterPreset })}
                    className="mt-3 h-11 w-full rounded-small border border-primary/30 bg-card px-3 text-sm font-bold outline-none transition-all duration-600 focus:border-primary focus:ring-4 focus:ring-ring/20"
                  >
                    {FILTER_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>下載或公開</CardTitle>
                <CardDescription>照片預設私人；是否加入公開相簿由領取者決定。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block text-sm font-extrabold">
                  照片名稱
                  <input
                    value={title}
                    maxLength={80}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-2 h-11 w-full rounded-small border border-primary/30 bg-background px-3 font-bold outline-none transition-all duration-600 focus:border-primary focus:ring-4 focus:ring-ring/20"
                  />
                </label>
                <ToggleOption
                  label="公開到網站相簿"
                  description="公開後所有人都能看到；不勾選就維持私人草稿"
                  checked={publishPublicly}
                  onChange={setPublishPublicly}
                />
                <Button
                  className="w-full"
                  disabled={!processedBlob || !publishPublicly || isPublishing || isProcessing}
                  onClick={() => void handlePublish()}
                >
                  {isPublishing ? <IconRefresh className="animate-spin motion-reduce:animate-none" /> : <IconCloudUpload />}
                  {isPublishing ? "公開中" : "公開到示範相簿"}
                </Button>
                <Link href="/gallery" className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>
                  查看公開相簿
                  <IconArrowRight aria-hidden="true" />
                </Link>
                <p className="min-h-6 text-sm font-extrabold leading-6 text-primary-strong" aria-live="polite">
                  {message}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
