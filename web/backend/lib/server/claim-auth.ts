import "server-only";

import { getClaimedDraft } from "@/lib/server/drafts";
import { ApiError, bearerToken, isUuid } from "@/lib/server/validation";

export async function requireClaim(request: Request, draftId: string) {
  const token = bearerToken(request);
  if (!isUuid(draftId) || !isUuid(token)) throw new ApiError("INVALID_CLAIM_TOKEN", 401);
  const draft = await getClaimedDraft(draftId, token);
  return { draft, token };
}

