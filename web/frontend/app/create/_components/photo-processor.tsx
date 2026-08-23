"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  IconArrowRight,
  IconCloudUpload,
  IconDownload,
  IconKey,
  IconPhoto,
  IconRefresh,
} from "@tabler/icons-react";

import { claimDraft, publishDraft, uploadProcessedPhoto } from "@/api/drafts";
import type { ClaimedDraft } from "@/api/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

async function getImageSize(blob: Blob) {
  const image = await createImageBitmap(blob);
  try {
    return { width: image.width, height: image.height };
  } finally {
    image.close();
  }
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
  const id = useId();

  return (
    <div className="flex items-start gap-3 rounded-primary border border-primary/25 bg-background p-4 transition-all duration-600 hover:border-primary/60">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-1"
      />
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block font-extrabold">{label}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-foreground/65">{description}</span>
      </label>
    </div>
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
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState("掃描機身 NFC 後，輸入相機螢幕上的領取碼");

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

  async function loadClaimedPhoto(claimed: ClaimedDraft, code: string) {
    setIsLoadingOriginal(true);
    setMessage("領取成功，正在下載私人原圖…");
    try {
      const response = await fetch(claimed.originalUrl, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${claimed.claimToken}` },
      });
      if (!response.ok) throw new Error(`ORIGINAL_HTTP_${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error("ORIGINAL_EMPTY");

      setOriginalBlob(blob);
      setTitle(`Tiger Camera ${code}`);
      setOptions((current) => ({
        ...current,
        capturedAt: toLocalDateTime(claimed.capturedAt),
      }));
    } catch {
      setMessage("照片已領取，但原圖下載失敗；請檢查 R2 CORS 後按「重新載入原圖」");
    } finally {
      setIsLoadingOriginal(false);
    }
  }

  async function handleClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = claimCode.replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      setMessage("請輸入相機螢幕上的 6 位英數領取碼");
      return;
    }

    setIsClaiming(true);
    setMessage("正在領取私人照片…");
    try {
      const claimed = await claimDraft(normalizedCode);
      setDraft(claimed);
      window.sessionStorage.setItem(
        `tiger_camera_claim_${claimed.id}`,
        claimed.claimToken,
      );
      await loadClaimedPhoto(claimed, normalizedCode);
    } catch (error) {
      if (isAxiosError(error) && !error.response) {
        setMessage("無法連線到 Backend API，請檢查 API 網址或是否已啟動後端");
      } else if (isAxiosError(error) && error.response?.status === 404) {
        setMessage("領取碼不存在、已使用或已過期，請確認相機螢幕");
      } else if (isAxiosError(error) && error.response?.status === 400) {
        setMessage("領取碼格式錯誤，請輸入 6 位英數字元");
      } else {
        setMessage("領取失敗，請稍後再試");
      }
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
      const { width, height } = await getImageSize(processedBlob);
      await uploadProcessedPhoto(draft.id, draft.claimToken, processedBlob);
      const textMode = options.textEnabled ? options.textMode : "none";
      const resolvedText = options.textEnabled
        ? options.textMode === "custom"
          ? options.customText.trim()
          : options.defaultText
        : null;
      await publishDraft(draft.id, draft.claimToken, {
        title: title.trim() || "今天的照片",
        processedSize: processedBlob.size,
        width,
        height,
        frameEnabled: options.frameEnabled,
        timestampEnabled: options.timestampEnabled,
        textMode,
        customText: textMode === "custom" ? options.customText.trim() : null,
        resolvedText,
        filterPreset: options.filterPreset,
        processingVersion: "canvas-v1",
      });
      window.sessionStorage.removeItem(`tiger_camera_claim_${draft.id}`);
      setMessage("完成圖已保存並加入公開相簿");
    } catch {
      setMessage("公開沒有完成，仍可先下載照片後再重試");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="max-w-6xl">
        <p className="mb-4 font-title text-sm font-extrabold tracking-[0.14em] text-primary">CLAIM YOUR PHOTO</p>
        <h1 className="subTitle">
          輸入領取碼，帶走你的照片
        </h1>
        <p className="mt-5 max-w-5xl text-base font-semibold leading-7 text-foreground/65">
          相機會透過網路先把原圖暫存成私人草稿。掃描機身 NFC 開啟此頁，再輸入螢幕上的領取碼，就能在自己的手機後製並下載完成圖
        </p>
      </header>

      <ol className="grid gap-3 md:grid-cols-4" aria-label="照片領取流程">
        {["拍照並等待上傳", "掃描機身 NFC", "輸入螢幕領取碼", "後製、下載或公開"].map((label, index) => (
          <li key={label} className="rounded-primary border border-primary/25 bg-background p-4 text-sm font-extrabold">
            <span className="mr-2 text-primary">{index + 1}.</span>
            {label}
          </li>
        ))}
      </ol>

      {!draft && (
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <span className="mb-3 grid size-12 place-items-center rounded-pill bg-accent text-primary">
              <IconKey aria-hidden="true" />
            </span>
            <CardTitle>領取私人草稿</CardTitle>
            <CardDescription>
              領取碼只是 6 位照片配對碼，不是安全密碼；24 小時逾時或成功領取後即失效。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleClaim(event)}>
              <label className="block text-sm font-extrabold">
                6 位領取碼
                <input
                  autoCapitalize="characters"
                  autoComplete="one-time-code"
                  inputMode="text"
                  maxLength={6}
                  value={claimCode}
                  onChange={(event) => setClaimCode(event.target.value.toUpperCase())}
                  placeholder="例如 A4F92C"
                  className="mt-2 h-14 w-full rounded-primary border border-primary/25 bg-background px-4 text-center text-xl font-black tracking-[0.2em] uppercase outline-none transition-all duration-600 placeholder:tracking-normal focus:border-primary"
                />
              </label>
              <Button className="w-full" type="submit" disabled={isClaiming}>
                {isClaiming ? <IconRefresh className="animate-spin motion-reduce:animate-none" /> : <IconPhoto />}
                {isClaiming ? "領取中" : "領取我的照片"}
              </Button>
              <p className="min-h-6 text-sm font-extrabold leading-6 text-primary" aria-live="polite">
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
                領取後仍是私人狀態；下載完成圖不等於公開，只有勾選公開才會加入相簿。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="overflow-hidden rounded-primary bg-foreground/5">
                  {/* Blob URLs cannot use the Next.js image optimizer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="後製照片預覽" className="mx-auto max-h-[68svh] w-full object-contain" />
                </div>
              ) : (
                <div className="grid min-h-80 place-items-center gap-4 rounded-primary bg-foreground/5 p-6 text-center">
                  {isLoadingOriginal || originalBlob ? (
                    <IconRefresh
                      className="animate-spin text-primary motion-reduce:animate-none"
                      aria-label={isLoadingOriginal ? "正在下載原圖" : "正在產生預覽"}
                    />
                  ) : (
                    <div className="space-y-4">
                      <p className="font-bold text-foreground/65">{message}</p>
                      <Button
                        variant="secondary"
                        onClick={() => void loadClaimedPhoto(draft, claimCode.replace(/[^a-z0-9]/gi, "").toUpperCase())}
                      >
                        <IconRefresh />
                        重新載入原圖
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  disabled={!processedBlob || isProcessing}
                  onClick={() => processedBlob && downloadBlob(processedBlob, `${title}-finished.jpg`)}
                >
                  {isProcessing ? <IconRefresh className="animate-spin motion-reduce:animate-none" /> : <IconDownload />}
                  下載完成圖
                </Button>
              </div>
            </CardContent>
          </Card>

          <aside
            aria-label="後製設定"
            tabIndex={0}
            className="processor-scrollbar space-y-5 md:h-[calc(100svh-8rem)] md:overflow-y-auto md:overscroll-contain md:pr-3 md:focus-visible:outline-none"
          >
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
                  description="顯示照片的拍攝日期與時間"
                  checked={options.timestampEnabled}
                  onChange={(timestampEnabled) => updateOptions({ timestampEnabled })}
                />
                <ToggleOption
                  label="文字"
                  description="自訂一句話，或使用隨機預設文字"
                  checked={options.textEnabled}
                  onChange={(textEnabled) => updateOptions({ textEnabled })}
                />
                {options.textEnabled && (
                  <div className="space-y-3 rounded-primary bg-primary/10 p-4">
                    <RadioGroup
                      value={options.textMode}
                      onValueChange={(textMode) =>
                        updateOptions({ textMode: textMode as ProcessingOptions["textMode"] })
                      }
                      className="flex gap-4 text-sm font-extrabold"
                      aria-label="文字內容模式"
                    >
                      <label className="flex cursor-pointer items-center gap-2">
                        <RadioGroupItem value="custom" />
                        自訂
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <RadioGroupItem value="default" />
                        預設
                      </label>
                    </RadioGroup>
                    {options.textMode === "custom" ? (
                      <Input
                        value={options.customText}
                        maxLength={40}
                        placeholder="輸入想寫在照片上的文字"
                        onChange={(event) => updateOptions({ customText: event.target.value })}
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

                <div className="rounded-primary border border-primary/25 bg-background p-4">
                  <span id="filter-label" className="mb-3 block font-extrabold">復古濾鏡</span>
                  <Select
                    value={options.filterPreset}
                    onValueChange={(filterPreset) =>
                      updateOptions({ filterPreset: filterPreset as FilterPreset })
                    }
                  >
                    <SelectTrigger aria-labelledby="filter-label">
                      <SelectValue placeholder="選擇濾鏡" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    className="mt-2 h-11 w-full rounded-primary border border-primary/25 bg-background px-3 font-bold outline-none transition-all duration-600 focus:border-primary"
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
                  {isPublishing ? "公開中" : "公開到網站相簿"}
                </Button>
                <Link href="/gallery" className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>
                  查看公開相簿
                  <IconArrowRight aria-hidden="true" />
                </Link>
                <p className="min-h-6 text-sm font-extrabold leading-6 text-primary" aria-live="polite">
                  {message}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
