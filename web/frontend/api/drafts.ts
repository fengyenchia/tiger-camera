import { apiClient } from "@/api/common";
import type { ClaimedDraft, Photo, PublishDraftInput } from "@/api/types";

export async function claimDraft(code: string) {
  const { data } = await apiClient.post<{ draft: ClaimedDraft }>("/drafts/claim", {
    code,
  });
  return data.draft;
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
