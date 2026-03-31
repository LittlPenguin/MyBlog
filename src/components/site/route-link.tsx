"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition } from "react";
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
  ...props
}: RouteLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { beginTransition } = usePageTransition();
  const hrefValue =
    typeof href === "string"
      ? href
      : href.pathname
        ? `${href.pathname}${href.search ?? ""}${href.hash ?? ""}`
        : null;

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

    event.preventDefault();
    beginTransition(hrefValue, transitionKey ?? hrefValue);

    startTransition(() => {
      const options = { scroll: preserveScroll ? false : (scroll ?? true) };

      if (replace) {
        router.replace(hrefValue, options);
      } else {
        router.push(hrefValue, options);
      }
    });
  };

  return (
    <Link
      href={href}
      replace={replace}
      scroll={scroll}
      prefetch
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
