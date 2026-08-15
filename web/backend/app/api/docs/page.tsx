import type { Metadata } from "next";

import { SwaggerUi } from "@/app/api/docs/_components/swagger-ui";
import { getApiDocs } from "@/lib/server/swagger";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "API Docs | Tiger Camera",
  description: "Tiger Camera Backend Swagger UI",
};

export default function ApiDocsPage() {
  const spec = getApiDocs() as Record<string, unknown>;

  return <SwaggerUi spec={spec} />;
}
