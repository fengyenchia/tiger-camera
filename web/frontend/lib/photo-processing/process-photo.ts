export type TextMode = "custom" | "default";

export type FilterPreset = "none" | "tiger-film" | "jungle-green" | "baby-tiger" | "night-hunter";

export type ProcessingOptions = {
  frameEnabled: boolean;
  timestampEnabled: boolean;
  textEnabled: boolean;
  textMode: TextMode;
  customText: string;
  defaultText: string;
  filterPreset: FilterPreset;
  capturedAt: string;
};

export const DEFAULT_TEXTS = [
  "ROAR!",
  "抓到你了！",
  "虎視眈眈！",
  "今日獵物 +1",
  "小虎拍到了！",
] as const;

const FILTERS: Record<FilterPreset, string> = {
  none: "none",
  "tiger-film": "sepia(0.3) saturate(1.08) contrast(1.08) brightness(1.03)",
  "jungle-green": "sepia(0.18) hue-rotate(32deg) saturate(0.9) contrast(1.08)",
  "baby-tiger": "sepia(0.16) saturate(1.2) brightness(1.08) contrast(0.96)",
  "night-hunter": "sepia(0.2) saturate(0.78) brightness(0.84) contrast(1.18)",
};

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("無法輸出 JPEG"))),
      "image/jpeg",
      0.9,
    );
  });
}

function formatTimestamp(value: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replaceAll("/", ".");
}

export function hasAnyEffect(options: ProcessingOptions) {
  return (
    options.frameEnabled ||
    options.timestampEnabled ||
    options.textEnabled ||
    options.filterPreset !== "none"
  );
}

export async function processPhoto(file: File, options: ProcessingOptions) {
  if (options.textEnabled && options.textMode === "custom" && !options.customText.trim()) {
    throw new Error("請輸入文字，或改選預設文字／關閉文字");
  }
  if (!hasAnyEffect(options)) return file;

  await document.fonts.ready;
  const image = await createImageBitmap(file);

  try {
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const photoWidth = Math.max(1, Math.round(image.width * scale));
    const photoHeight = Math.max(1, Math.round(image.height * scale));
    const side = options.frameEnabled ? Math.round(Math.min(photoWidth, photoHeight) * 0.055) : 0;
    const top = side;
    const bottom = options.frameEnabled ? Math.round(Math.min(photoWidth, photoHeight) * 0.18) : 0;

    const canvas = document.createElement("canvas");
    canvas.width = photoWidth + side * 2;
    canvas.height = photoHeight + top + bottom;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("瀏覽器無法建立 Canvas");

    if (options.frameEnabled) {
      context.fillStyle = "#fffaf0";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.save();
    context.filter = FILTERS[options.filterPreset];
    context.drawImage(image, side, top, photoWidth, photoHeight);
    context.restore();

    if (options.filterPreset !== "none") {
      context.fillStyle = "rgb(215 71 63 / 0.06)";
      context.fillRect(side, top, photoWidth, photoHeight);
    }

    const fontSize = Math.max(18, Math.round(Math.min(photoWidth, photoHeight) * 0.035));
    context.font = `700 ${fontSize}px "Noto Sans TC Local", sans-serif`;
    context.textBaseline = "bottom";

    const timestamp = options.timestampEnabled ? formatTimestamp(options.capturedAt) : "";
    const text = options.textEnabled
      ? options.textMode === "custom"
        ? options.customText.trim()
        : options.defaultText
      : "";

    if (options.frameEnabled) {
      context.fillStyle = "#9f332f";
      if (text) context.fillText(text, side, canvas.height - Math.max(16, bottom * 0.48));
      if (timestamp) {
        context.font = `600 ${Math.max(14, Math.round(fontSize * 0.62))}px "Noto Sans TC Local", sans-serif`;
        context.fillStyle = "#775d55";
        context.fillText(timestamp, side, canvas.height - Math.max(8, bottom * 0.16));
      }
    } else {
      const padding = Math.max(14, Math.round(fontSize * 0.7));
      const lines = [text, timestamp].filter(Boolean);
      if (lines.length) {
        const widest = Math.max(...lines.map((line) => context.measureText(line).width));
        const boxHeight = lines.length * fontSize * 1.35 + padding;
        context.fillStyle = "rgb(75 43 40 / 0.58)";
        context.fillRect(
          padding,
          canvas.height - boxHeight - padding,
          Math.min(canvas.width - padding * 2, widest + padding * 2),
          boxHeight,
        );
        context.fillStyle = "#fffaf0";
        lines.forEach((line, index) => {
          context.fillText(line, padding * 2, canvas.height - padding * 1.7 - (lines.length - 1 - index) * fontSize * 1.3);
        });
      }
    }

    return canvasToBlob(canvas);
  } finally {
    image.close();
  }
}
