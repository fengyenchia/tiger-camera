export type Photo = {
  id: string;
  title: string;
  originalUrl: string;
  processedUrl: string;
  createdAt: string;
  filterPreset: string;
};

export type CreatePhotoInput = Pick<
  Photo,
  "title" | "originalUrl" | "processedUrl" | "filterPreset"
>;

export type PhotoListResponse = {
  photos: Photo[];
  demoMode: boolean;
};

export type ClaimedDraft = {
  id: string;
  claimToken: string;
  originalUrl: string;
  capturedAt: string;
  expiresAt: string;
  demoMode: boolean;
};

export type PublishDraftInput = {
  title: string;
  processedUrl: string;
  filterPreset: string;
};
