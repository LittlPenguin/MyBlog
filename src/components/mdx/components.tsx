import Image from "next/image";
import type { MDXComponents as MDXComponentMap } from "mdx/types";

export const MDXComponents: MDXComponentMap = {
  img: ({ alt = "", src = "", ...props }) => (
    <Image
      alt={alt}
      src={src}
      width={1600}
      height={900}
      className="h-auto w-full"
      sizes="(min-width: 1024px) 960px, 100vw"
      {...props}
    />
  ),
};
