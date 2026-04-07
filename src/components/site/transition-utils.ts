"use client";

export type RouteStageSnapshot = {
  html: string;
  width: number;
  height: number;
};

const ROUTE_STAGE_SELECTOR = '[data-route-stage="main"]';

export function getRouteStageElement() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.querySelector<HTMLElement>(ROUTE_STAGE_SELECTOR);
}

export function captureRouteStageSnapshot(element: HTMLElement) {
  const clone = element.cloneNode(true);

  if (!(clone instanceof HTMLElement)) {
    return null;
  }

  clone.removeAttribute("id");
  clone.querySelectorAll("[data-route-overlay-ignore]").forEach((node) => node.remove());
  clone.querySelectorAll("script").forEach((node) => node.remove());
  clone.querySelectorAll("video, audio").forEach((node) => node.remove());

  const rect = element.getBoundingClientRect();

  return {
    html: clone.innerHTML,
    width: rect.width,
    height: rect.height,
  } satisfies RouteStageSnapshot;
}

export function resolveTransitionPathname(href: string) {
  if (typeof window === "undefined") {
    return href.split("#")[0]?.split("?")[0] ?? href;
  }

  try {
    return new URL(href, window.location.href).pathname;
  } catch {
    return href.split("#")[0]?.split("?")[0] ?? href;
  }
}

export function waitForAnimationFrames(frameCount = 2) {
  if (typeof window === "undefined" || frameCount <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let remainingFrames = frameCount;

    const advance = () => {
      remainingFrames -= 1;

      if (remainingFrames <= 0) {
        resolve();
        return;
      }

      window.requestAnimationFrame(advance);
    };

    window.requestAnimationFrame(advance);
  });
}
