import "server-only";

import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/server/env";

type QueryValue = boolean | number | string | null;

let client: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!client) client = neon(getDatabaseUrl());
  return client;
}

export async function query<Row extends Record<string, unknown>>(
  text: string,
  params: QueryValue[] = [],
) {
  const result = await getDb().query(text, params);
  return result as Row[];
}

export async function checkDatabase() {
  const rows = await query<{ ok: number }>("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}
