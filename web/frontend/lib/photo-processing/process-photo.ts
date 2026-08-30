export type TextMode = "custom" | "default";
export type TextPosition = "left" | "center" | "right";
export type FrameLayout = "portrait" | "landscape" | "square";

export type FilterPreset =
  | "none"
  | "tiger-film"
  | "baby-tiger"
  | "night-hunter"
  | "mono-mochi"
  | "neon-party"
  | "sunny-milk"
  | "candy-pop"
  | "lavender-dream";

export type ProcessingOptions = {
  frameEnabled: boolean;
  frameLayout: FrameLayout;
  timestampEnabled: boolean;
  textEnabled: boolean;
  textMode: TextMode;
  customText: string;
  defaultText: string;
  filterPreset: FilterPreset;
  capturedAt: string;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  grain: number;
  vignette: number;
  textSize: number;
  textPosition: TextPosition;
};

export const DEFAULT_TEXTS = [
  "ROAR!",
  "抓到你了！",
  "虎視眈眈！",
  "今日獵物 +1",
  "小虎拍到了！",
] as const;

const FILTERS: Record<FilterPreset, string> = {
  none: "",
  "tiger-film": "sepia(0.28) saturate(1.08) contrast(1.08) brightness(1.03)",
  "baby-tiger": "sepia(0.12) saturate(1.14) brightness(1.08) contrast(0.97)",
  "night-hunter": "saturate(0.72) brightness(0.87) contrast(1.18) hue-rotate(210deg)",
  "mono-mochi": "grayscale(1) contrast(1.3) brightness(1.04)",
  "neon-party": "saturate(1.68) contrast(1.18) brightness(1.05) hue-rotate(292deg)",
  "sunny-milk": "sepia(0.08) saturate(0.9) brightness(1.14) contrast(0.94)",
  "candy-pop": "saturate(1.4) contrast(1.04) brightness(1.08) hue-rotate(-8deg)",
  "lavender-dream": "sepia(0.1) saturate(1.1) brightness(1.05) hue-rotate(245deg)",
};

const FILTER_OVERLAYS: Record<FilterPreset, string | null> = {
  none: null,
  "tiger-film": "rgb(215 71 63 / 0.05)",
  "baby-tiger": "rgb(255 143 173 / 0.07)",
  "night-hunter": "rgb(46 82 157 / 0.08)",
  "mono-mochi": null,
  "neon-party": "rgb(223 68 224 / 0.1)",
  "sunny-milk": "rgb(255 205 125 / 0.07)",
  "candy-pop": "rgb(255 102 166 / 0.08)",
  "lavender-dream": "rgb(135 104 221 / 0.09)",
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

function applyWarmth(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  warmth: number,
) {
  if (!warmth) return;
  const alpha = Math.abs(warmth) / 100 * 0.2;
  context.save();
  context.globalCompositeOperation = "soft-light";
  context.fillStyle = warmth > 0
    ? `rgb(238 137 72 / ${alpha})`
    : `rgb(74 142 218 / ${alpha})`;
  context.fillRect(x, y, width, height);
  context.restore();
}

function applyGrain(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  amount: number,
) {
  if (!amount) return;
  const noise = document.createElement("canvas");
  noise.width = 96;
  noise.height = 96;
  const noiseContext = noise.getContext("2d");
  if (!noiseContext) return;

  const pixels = noiseContext.createImageData(noise.width, noise.height);
  let seed = width * 31 + height * 17;
  for (let index = 0; index < pixels.data.length; index += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const value = seed >>> 24;
    pixels.data[index] = value;
    pixels.data[index + 1] = value;
    pixels.data[index + 2] = value;
    pixels.data[index + 3] = 255;
  }
  noiseContext.putImageData(pixels, 0, 0);
  const pattern = context.createPattern(noise, "repeat");
  if (!pattern) return;

  context.save();
  context.globalAlpha = amount / 100 * 0.38;
  context.globalCompositeOperation = "soft-light";
  context.fillStyle = pattern;
  context.fillRect(x, y, width, height);
  context.restore();
}

function applyVignette(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  amount: number,
) {
  if (!amount) return;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const innerRadius = Math.min(width, height) * 0.24;
  const outerRadius = Math.hypot(width / 2, height / 2);
  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    innerRadius,
    centerX,
    centerY,
    outerRadius,
  );
  gradient.addColorStop(0, "rgb(0 0 0 / 0)");
  gradient.addColorStop(0.58, "rgb(0 0 0 / 0)");
  gradient.addColorStop(1, `rgb(0 0 0 / ${amount / 100 * 0.82})`);
  context.fillStyle = gradient;
  context.fillRect(x, y, width, height);
}

function textPlacement(position: TextPosition, width: number, padding: number) {
  if (position === "center") {
    return { align: "center" as const, x: width / 2 };
  }
  if (position === "right") {
    return { align: "right" as const, x: width - padding };
  }
  return { align: "left" as const, x: padding };
}

export async function processPhoto(file: File, options: ProcessingOptions) {
  if (options.textEnabled && options.textMode === "custom" && !options.customText.trim()) {
    throw new Error("請輸入文字，或改選預設文字／關閉文字");
  }
  await document.fonts.ready;
  const image = await createImageBitmap(file);

  try {
    const maxSide = 1800;
    const targetAspect = options.frameLayout === "portrait"
      ? 3 / 4
      : options.frameLayout === "landscape"
        ? 4 / 3
        : 1;
    const sourceAspect = image.width / image.height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.width;
    let sourceHeight = image.height;

    if (sourceAspect > targetAspect) {
      sourceWidth = Math.round(image.height * targetAspect);
      sourceX = Math.round((image.width - sourceWidth) / 2);
    } else if (sourceAspect < targetAspect) {
      sourceHeight = Math.round(image.width / targetAspect);
      sourceY = Math.round((image.height - sourceHeight) / 2);
    }

    const outputLongSide = Math.min(maxSide, Math.max(image.width, image.height));
    const photoWidth = options.frameLayout === "portrait"
      ? Math.round(outputLongSide * 3 / 4)
      : outputLongSide;
    const photoHeight = options.frameLayout === "landscape"
      ? Math.round(outputLongSide * 3 / 4)
      : outputLongSide;
    const side = options.frameEnabled ? Math.round(Math.min(photoWidth, photoHeight) * 0.055) : 0;
    const top = side;
    const bottom = options.frameEnabled ? Math.round(Math.min(photoWidth, photoHeight) * 0.18) : 0;

    const canvas = document.createElement("canvas");
    canvas.width = photoWidth + side * 2;
    canvas.height = photoHeight + top + bottom;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("瀏覽器無法建立 Canvas");
    const photoX = side;
    const photoY = top;

    if (options.frameEnabled) {
      context.fillStyle = "#fffaf0";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.save();
    context.filter = [
      FILTERS[options.filterPreset],
      `brightness(${options.brightness / 100})`,
      `contrast(${options.contrast / 100})`,
      `saturate(${options.saturation / 100})`,
    ].filter(Boolean).join(" ");
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      photoX,
      photoY,
      photoWidth,
      photoHeight,
    );
    context.restore();

    const filterOverlay = FILTER_OVERLAYS[options.filterPreset];
    if (filterOverlay) {
      context.save();
      context.globalCompositeOperation = "soft-light";
      context.fillStyle = filterOverlay;
      context.fillRect(photoX, photoY, photoWidth, photoHeight);
      context.restore();
    }

    applyWarmth(context, photoX, photoY, photoWidth, photoHeight, options.warmth);
    applyGrain(context, photoX, photoY, photoWidth, photoHeight, options.grain);
    applyVignette(context, photoX, photoY, photoWidth, photoHeight, options.vignette);

    const baseFontSize = Math.max(
      18,
      Math.round(Math.min(photoWidth, photoHeight) * 0.035),
    );
    const fontSize = Math.max(8, Math.round(baseFontSize * options.textSize / 100));
    context.font = `700 ${fontSize}px "Noto Sans TC Local", sans-serif`;
    context.textBaseline = "bottom";

    const timestamp = options.timestampEnabled ? formatTimestamp(options.capturedAt) : "";
    const text = options.textEnabled
      ? options.textMode === "custom"
        ? options.customText.trim()
        : options.defaultText
      : "";

    if (options.frameEnabled) {
      const placement = textPlacement(options.textPosition, canvas.width, side);
      context.textAlign = placement.align;
      context.fillStyle = "#9f332f";
      if (text) context.fillText(text, placement.x, canvas.height - Math.max(16, bottom * 0.48));
      if (timestamp) {
        context.font = `600 ${Math.max(14, Math.round(fontSize * 0.62))}px "Noto Sans TC Local", sans-serif`;
        context.fillStyle = "#775d55";
        context.fillText(timestamp, placement.x, canvas.height - Math.max(8, bottom * 0.16));
      }
    } else {
      const padding = Math.max(14, Math.round(fontSize * 0.7));
      const lines = [text, timestamp].filter(Boolean);
      if (lines.length) {
        const placement = textPlacement(options.textPosition, canvas.width, padding * 2);
        context.textAlign = placement.align;
        context.fillStyle = "#fffaf0";
        context.strokeStyle = "rgb(45 30 28 / 0.72)";
        context.lineJoin = "round";
        context.lineWidth = Math.max(2, Math.round(fontSize * 0.12));
        lines.forEach((line, index) => {
          const lineY = canvas.height - padding * 1.7 - (lines.length - 1 - index) * fontSize * 1.3;
          context.strokeText(line, placement.x, lineY);
          context.fillText(line, placement.x, lineY);
        });
      }
    }

    return canvasToBlob(canvas);
  } finally {
    image.close();
  }
}
