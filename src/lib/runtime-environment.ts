export function isCloudflareRuntime() {
  return (
    process.env.MYBLOG_FILE_STORAGE === "readonly" ||
    process.env.CF_PAGES === "1" ||
    Boolean(process.env.CF_WORKER) ||
    Boolean(process.env.WORKERS_CI) ||
    Boolean(process.env.CLOUDFLARE_ACCOUNT_ID)
  );
}
