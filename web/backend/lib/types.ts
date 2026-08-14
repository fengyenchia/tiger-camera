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

export type PublishDraftInput = {
  title: string;
  processedUrl: string;
  filterPreset: string;
};
