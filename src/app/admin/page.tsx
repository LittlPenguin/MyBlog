import type { Metadata } from "next";
import { AdminClient } from "./admin-client";
import { hasAdminAccessConfig, sanitizeAdminNextPath } from "@/lib/admin-auth";
import { isAdminRequest } from "@/lib/admin-auth-server";

export const metadata: Metadata = {
  title: "Admin Access",
  description: "Unlock administrator actions for content management.",
};

type SearchValue = string | string[] | undefined;

type PageProps = {
  searchParams: Promise<{
    next?: SearchValue;
  }>;
};

function readSearchValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = sanitizeAdminNextPath(readSearchValue(params.next));
  const canManage = await isAdminRequest();
  const isConfigured = hasAdminAccessConfig();

  return <AdminClient initialNext={nextPath} canManage={canManage} isConfigured={isConfigured} />;
}
