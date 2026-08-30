import { createSwaggerSpec } from "next-swagger-doc";

const fallbackApiUrl = "http://localhost:3001";

export function getApiDocs() {
  const apiUrl = (process.env.API_PUBLIC_URL || fallbackApiUrl).replace(/\/$/, "");

  return createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Tiger Camera API",
        version: "1.0.0",
        description:
          "Tiger Camera V1 Backend API：Neon metadata、私人 R2 草稿、固定 token 相機上傳、照片領取、完成圖發布、公開相簿與管理員永久刪除。",
      },
      servers: [
        {
          url: apiUrl,
          description:
            apiUrl === fallbackApiUrl ? "Local development" : "Configured API server",
        },
      ],
      tags: [
        { name: "Health", description: "部署健康檢查" },
        { name: "Device", description: "ESP32 私人草稿上傳" },
        { name: "Drafts", description: "照片領取、私人讀取與發布" },
        { name: "Photos", description: "公開完成圖" },
        { name: "Admin", description: "管理員登入與永久刪除" },
        { name: "Maintenance", description: "受 CRON_SECRET 保護的清理工作" },
      ],
      components: {
        securitySchemes: {
          DeviceAuth: {
            type: "http",
            scheme: "bearer",
            description: "ESP32 與 Backend environment 共用的固定高熵 DEVICE_UPLOAD_TOKEN",
          },
          ClaimAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "UUID",
            description: "領取成功後取得的單張照片 opaque UUID token；不是 JWT",
          },
          AdminAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "管理員 30 分鐘 JWT",
          },
        },
        schemas: {
          ApiError: {
            type: "object",
            required: ["code"],
            properties: {
              code: { type: "string", example: "INVALID_INPUT" },
            },
          },
          Photo: {
            type: "object",
            required: [
              "id",
              "title",
              "imageUrl",
              "createdAt",
              "filterPreset",
            ],
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string", example: "今天的照片" },
              imageUrl: {
                type: "string",
                description: "公開完成圖 URL；公開 API 不提供暫存原圖 URL",
              },
              createdAt: { type: "string", format: "date-time" },
              filterPreset: {
                type: "string",
                enum: ["none", "tiger-film", "baby-tiger", "night-hunter", "mono-mochi", "neon-party", "sunny-milk", "candy-pop", "lavender-dream", "jungle-green"],
                description: "jungle-green 僅可能出現在歷史照片；新發布不可使用。",
              },
            },
          },
          ClaimDraft: {
            type: "object",
            required: [
              "id",
              "claimToken",
              "originalUrl",
              "capturedAt",
              "expiresAt",
            ],
            properties: {
              id: { type: "string", format: "uuid" },
              claimToken: {
                type: "string",
                format: "uuid",
                example: "9d4e0b7a-31c4-4f55-8c26-7b0e6a14d2f3",
              },
              originalUrl: { type: "string", example: "https://api.tiger-camera.fengyenchia.com/api/drafts/uuid/image" },
              capturedAt: { type: "string", format: "date-time" },
              expiresAt: { type: "string", format: "date-time" },
            },
          },
          PublishDraftInput: {
            type: "object",
            required: [
              "title",
              "width",
              "height",
              "processedSize",
              "frameEnabled",
              "timestampEnabled",
              "textMode",
              "filterPreset",
              "processingVersion",
            ],
            properties: {
              title: { type: "string", maxLength: 80 },
              width: { type: "integer", minimum: 1 },
              height: { type: "integer", minimum: 1 },
              processedSize: { type: "integer", minimum: 1 },
              frameEnabled: { type: "boolean" },
              timestampEnabled: { type: "boolean" },
              textMode: { type: "string", enum: ["custom", "default", "none"] },
              customText: { type: "string", nullable: true, maxLength: 40 },
              resolvedText: { type: "string", nullable: true, maxLength: 40 },
              filterPreset: {
                type: "string",
                enum: ["none", "tiger-film", "baby-tiger", "night-hunter", "mono-mochi", "neon-party", "sunny-milk", "candy-pop", "lavender-dream"],
              },
              processingVersion: { type: "string", example: "canvas-v3" },
            },
          },
        },
      },
    },
  });
}
