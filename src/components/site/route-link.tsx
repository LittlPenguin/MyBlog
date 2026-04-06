"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffectEvent } from "react";
import { cn } from "@/lib/utils";
import { usePageTransition } from "./transition-context";

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
  const { beginTransition, cancelTransition } = usePageTransition();
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

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
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

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const nextScroll = preserveScroll ? false : (scroll ?? true);

    if (reducedMotion) {
      return;
    }

    event.preventDefault();

    const transitionId = beginTransition({
      href: hrefValue,
      fromPathname: pathname,
      toPathname: hrefValue.split("#")[0]?.split("?")[0] ?? hrefValue,
      key: transitionKey ?? hrefValue,
      replace: replace ?? false,
      scroll: nextScroll,
    });

    const navigate = replace ? router.replace : router.push;

    try {
      navigate(hrefValue, { scroll: nextScroll });
    } catch (error) {
      cancelTransition();
      throw error;
    }

    window.setTimeout(() => {
      cancelTransition(transitionId);
    }, 2400);
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
