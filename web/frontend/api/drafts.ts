import axios from "axios";

import { apiClient } from "@/api/common";
import type {
  ClaimedDraft,
  Photo,
  PublishDraftInput,
  UploadInstruction,
} from "@/api/types";

export async function claimDraft(code: string) {
  const { data } = await apiClient.post<{ draft: ClaimedDraft }>("/drafts/claim", {
    code,
  });
  return data.draft;
}

export async function downloadClaimedPhoto(
  draftId: string,
  claimToken: string,
) {
  const { data } = await apiClient.get<Blob>(`/drafts/${draftId}/image`, {
    headers: { Authorization: `Bearer ${claimToken}` },
    responseType: "blob",
  });
  return data;
}

export async function uploadProcessedPhoto(
  draftId: string,
  claimToken: string,
  blob: Blob,
) {
  const { data } = await apiClient.post<UploadInstruction>(
    `/drafts/${draftId}/process/initiate`,
    { processedSize: blob.size },
    { headers: { Authorization: `Bearer ${claimToken}` } },
  );
  await axios.put(data.upload.url, blob, {
    headers: data.upload.headers,
    timeout: 60_000,
  });
}

export async function publishDraft(
  draftId: string,
  claimToken: string,
  input: PublishDraftInput,
) {
  const { data } = await apiClient.post<{ photo: Photo }>(
    `/drafts/${draftId}/publish`,
    input,
    { headers: { Authorization: `Bearer ${claimToken}` } },
  );
  return data.photo;
}
