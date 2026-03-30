import { GlassPanel, Pill } from "@/components/site/ui";
import { RouteLink } from "@/components/site/route-link";

export default function NotFound() {
  return (
    <section className="flex min-h-[65vh] items-center py-12">
      <GlassPanel className="mx-auto w-full max-w-3xl p-8 text-center md:p-12">
        <Pill active>404 / Missing Page</Pill>
        <h1 className="mt-5 font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-7xl">
          这页暂时不在这里。
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          可能是链接已经变更，也可能是这部分内容还没有整理完成。你可以先回到首页，或者直接去看文章归档。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <RouteLink
            href="/"
            transitionKey="404-home"
            className="rounded-full bg-gradient-to-r from-primary to-primary-strong px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(172,42,31,0.22)]"
          >
            回到首页
          </RouteLink>
          <RouteLink
            href="/archive"
            transitionKey="404-archive"
            className="rounded-full border border-white/60 bg-white/58 px-5 py-3 text-sm font-semibold text-foreground"
          >
            查看归档
          </RouteLink>
        </div>
      </GlassPanel>
    </section>
  );
}
