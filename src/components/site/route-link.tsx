"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffectEvent } from "react";
import { cn } from "@/lib/utils";
import { usePageTransition } from "./transition-context";
import {
  captureRouteStageSnapshot,
  getRouteStageElement,
  resolveTransitionPathname,
  waitForAnimationFrames,
} from "./transition-utils";

type RouteLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    className?: string;
    transitionKey?: string;
    preserveScroll?: boolean;
  };

export function RouteLink({
  href,
  className,
  onClick,
  children,
  transitionKey,
  preserveScroll = false,
  replace,
  scroll,
  prefetch,
  ...props
}: RouteLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { beginTransition, isCurrentTransition, cancelTransition } = usePageTransition();
  const hrefValue =
    typeof href === "string"
      ? href
      : href.pathname
        ? `${href.pathname}${href.search ?? ""}${href.hash ?? ""}`
        : null;

  const warmRoute = useEffectEvent(() => {
    if (!hrefValue) {
      return;
    }

    const isExternal = /^(https?:|mailto:|tel:)/.test(hrefValue);
    const isHashLink = hrefValue.startsWith("#");

    if (isExternal || isHashLink) {
      return;
    }

    void router.prefetch(hrefValue);
  });

  const handleClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    const isExternal = hrefValue ? /^(https?:|mailto:|tel:)/.test(hrefValue) : false;
    const isHashLink = hrefValue?.startsWith("#");

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank" ||
      !hrefValue ||
      isExternal ||
      isHashLink
    ) {
      return;
    }

    if (hrefValue === pathname) {
      event.preventDefault();
      return;
    }

    const nextScroll = preserveScroll ? false : (scroll ?? true);
    const routeStage = getRouteStageElement();
    const snapshot = routeStage ? captureRouteStageSnapshot(routeStage) : null;
    const toPathname = resolveTransitionPathname(hrefValue);

    event.preventDefault();

    if (!snapshot) {
      const navigateWithoutTransition = replace ? router.replace : router.push;
      navigateWithoutTransition(hrefValue, { scroll: nextScroll });
      return;
    }

    const transitionId = beginTransition({
      href: hrefValue,
      fromPathname: pathname,
      toPathname,
      key: transitionKey ?? hrefValue,
      replace: replace ?? false,
      scroll: nextScroll,
      snapshot,
    });

    const navigate = replace ? router.replace : router.push;

    try {
      await waitForAnimationFrames(2);

      if (!isCurrentTransition(transitionId)) {
        return;
      }

      startTransition(() => {
        navigate(hrefValue, { scroll: nextScroll });
      });
    } catch (error) {
      cancelTransition(transitionId);
      throw error;
    }

    window.setTimeout(() => {
      cancelTransition(transitionId);
    }, 4000);
  };

  return (
    <Link
      href={href}
      replace={replace}
      scroll={preserveScroll ? false : scroll}
      prefetch={prefetch ?? true}
      className={cn(className)}
      onClick={handleClick}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event);
        warmRoute();
      }}
      onFocus={(event) => {
        props.onFocus?.(event);
        warmRoute();
      }}
      onTouchStart={(event) => {
        props.onTouchStart?.(event);
        warmRoute();
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
