"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

type SwaggerUiProps = {
  spec: Record<string, unknown>;
};

export function SwaggerUi({ spec }: SwaggerUiProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isCurrent = true;

    void import("swagger-ui-dist").then(
      ({ SwaggerUIBundle, SwaggerUIStandalonePreset }) => {
        if (!isCurrent) return;

        SwaggerUIBundle({
          domNode: container,
          spec,
          deepLinking: true,
          displayRequestDuration: true,
          docExpansion: "list",
          filter: true,
          persistAuthorization: false,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout",
        });
      },
    );

    return () => {
      isCurrent = false;
      container.replaceChildren();
    };
  }, [spec]);

  return <div ref={containerRef} />;
}
