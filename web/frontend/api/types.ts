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

// Only historical public photos can contain this retired value. It is never
// offered by the processor or accepted for a new publish request.
export type PublishedFilterPreset = FilterPreset | "jungle-green";
export type TextMode = "custom" | "default" | "none";

export type Photo = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  filterPreset: PublishedFilterPreset;
};

export type PhotoListResponse = {
  photos: Photo[];
};

export type ClaimedDraft = {
  id: string;
  claimToken: string;
  originalUrl: string;
  capturedAt: string;
  expiresAt: string;
};

export type PublishDraftInput = {
  filterPreset: FilterPreset;
  frameEnabled: boolean;
  height: number;
  processedSize: number;
  processingVersion: "canvas-v1" | "canvas-v2" | "canvas-v3";
  resolvedText: string | null;
  customText: string | null;
  textMode: TextMode;
  timestampEnabled: boolean;
  title: string;
  width: number;
};

export type UploadInstruction = {
  upload: {
    headers: Record<string, string>;
    method: "PUT";
    url: string;
  };
  expiresAt: string;
};
