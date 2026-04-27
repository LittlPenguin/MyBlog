import { getR2Binding } from "@/lib/cloudflare-bindings";
import { getR2Asset } from "@/lib/cloudflare-content-store";

type RouteProps = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const bucket = getR2Binding();

  if (!bucket) {
    return new Response("Not found", { status: 404 });
  }

  const { path } = await params;
  const key = ["uploads", ...path].join("/");
  const object = await getR2Asset(bucket, key);

  if (!object?.body) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag ?? "");
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, {
    headers,
  });
}
