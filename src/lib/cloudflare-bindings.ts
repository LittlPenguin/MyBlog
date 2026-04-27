import { getCloudflareContext } from "@opennextjs/cloudflare";

export type D1Result<T = unknown> = {
  results?: T[];
  success?: boolean;
};

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
};

export type D1DatabaseBinding = {
  prepare(query: string): D1PreparedStatement;
};

export type R2ObjectBinding = {
  body: ReadableStream | null;
  httpEtag?: string;
  uploaded?: Date;
  size?: number;
  writeHttpMetadata(headers: Headers): void;
};

export type R2BucketBinding = {
  get(key: string): Promise<R2ObjectBinding | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string | null,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
    },
  ): Promise<unknown>;
  delete(key: string | string[]): Promise<void>;
  list(options?: {
    prefix?: string;
    cursor?: string;
  }): Promise<{
    objects: Array<{ key: string }>;
    truncated: boolean;
    cursor?: string;
  }>;
};

export type MyBlogCloudflareEnv = CloudflareEnv & {
  MYBLOG_DB?: D1DatabaseBinding;
  MYBLOG_ASSETS?: R2BucketBinding;
};

export function getOptionalCloudflareEnv() {
  try {
    return getCloudflareContext().env as MyBlogCloudflareEnv;
  } catch {
    return null;
  }
}

export function getD1Binding(env: MyBlogCloudflareEnv | null = getOptionalCloudflareEnv()) {
  return env?.MYBLOG_DB ?? null;
}

export function getR2Binding(env: MyBlogCloudflareEnv | null = getOptionalCloudflareEnv()) {
  return env?.MYBLOG_ASSETS ?? null;
}
