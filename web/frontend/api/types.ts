export type FilterPreset = "none" | "tiger-film" | "jungle-green" | "baby-tiger" | "night-hunter";
export type TextMode = "custom" | "default" | "none";

export type Photo = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  filterPreset: FilterPreset;
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
  processingVersion: "canvas-v1";
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

export type AdminDevice = {
  id: string;
  name: string;
  status: "active" | "revoked";
  createdAt: string;
  lastSeenAt: string | null;
};
