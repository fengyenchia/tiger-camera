import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getR2Env } from "@/lib/server/env";

let client: S3Client | null = null;

function getR2() {
  if (!client) {
    const env = getR2Env();
    client = new S3Client({
      region: env.r2Region,
      endpoint: env.r2Endpoint,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    });
  }
  return client;
}

export function originalObjectKey(photoId: string) {
  return `drafts/${photoId}/original.jpg`;
}

export function finishedObjectKey(photoId: string) {
  return `photos/${photoId}/finished.jpg`;
}

export async function createJpegPutUrl(key: string, expiresIn = 300) {
  const env = getR2Env();
  return getSignedUrl(
    getR2(),
    new PutObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
      ContentType: "image/jpeg",
    }),
    { expiresIn },
  );
}

export async function createJpegGetUrl(key: string, expiresIn = 180) {
  const env = getR2Env();
  return getSignedUrl(
    getR2(),
    new GetObjectCommand({ Bucket: env.r2BucketName, Key: key }),
    { expiresIn },
  );
}

export async function headObject(key: string) {
  const env = getR2Env();
  return getR2().send(
    new HeadObjectCommand({ Bucket: env.r2BucketName, Key: key }),
  );
}

export async function deleteObject(key: string | null) {
  if (!key) return;
  const env = getR2Env();
  await getR2().send(
    new DeleteObjectCommand({ Bucket: env.r2BucketName, Key: key }),
  );
}
