export type PhotoStatus = "uploading" | "ready" | "claimed" | "active" | "deleting";
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
export type StoredFilterPreset = FilterPreset | "jungle-green";
export type TextMode = "custom" | "default" | "none";

export type Photo = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  filterPreset: StoredFilterPreset;
};
export type ProcessingMetadata = {
  filterPreset: FilterPreset;
  frameEnabled: boolean;
  timestampEnabled: boolean;
  textMode: TextMode;
  customText: string | null;
  resolvedText: string | null;
  processingVersion: string;
};

export type PublishDraftInput = ProcessingMetadata & {
  height: number;
  processedSize: number;
  title: string;
  width: number;
};

export type InitiateDraftInput = {
  capturedAt: string;
  clientRequestId: string;
  height: number;
  mimeType: "image/jpeg";
  originalSize: number;
  width: number;
};
