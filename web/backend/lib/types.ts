export type PhotoStatus = "uploading" | "ready" | "claimed" | "active" | "deleting";
export type FilterPreset = "none" | "tiger-film" | "jungle-green" | "baby-tiger" | "night-hunter";
export type TextMode = "custom" | "default" | "none";

export type Photo = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  filterPreset: FilterPreset;
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
