export function stripRouteSearchAndHash(value: string) {
  return value.split("#")[0]?.split("?")[0] ?? value;
}

export function safelyDecodeRoutePathname(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeRoutePathname(value: string) {
  return safelyDecodeRoutePathname(stripRouteSearchAndHash(value));
}
