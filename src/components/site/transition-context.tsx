"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { RouteStageSnapshot } from "./transition-utils";

type TransitionState = {
  id: number;
  href: string;
  fromPathname: string;
  toPathname: string;
  key: string;
  replace: boolean;
  scroll: boolean;
  startedAt: number;
  snapshot: RouteStageSnapshot;
} | null;

export type TransitionPhase = "idle" | "exiting" | "entering";

type BeginTransitionInput = {
  href: string;
  fromPathname: string;
  toPathname: string;
  key: string;
  replace: boolean;
  scroll: boolean;
  snapshot: RouteStageSnapshot;
};

type TransitionContextValue = {
  activeTransition: TransitionState;
  phase: TransitionPhase;
  beginTransition: (input: BeginTransitionInput) => number;
  setPhase: (phase: TransitionPhase) => void;
  isCurrentTransition: (transitionId: number) => boolean;
  cancelTransition: (transitionId?: number) => void;
  finishTransition: (transitionId?: number) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [activeTransition, setActiveTransition] = useState<TransitionState>(null);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const sequenceRef = useRef(0);
  const activeIdRef = useRef<number | null>(null);

  const beginTransition = useCallback((input: BeginTransitionInput) => {
    sequenceRef.current += 1;
    const id = sequenceRef.current;
    activeIdRef.current = id;

    setPhase("exiting");
    setActiveTransition({
      id,
      href: input.href,
      fromPathname: input.fromPathname,
      toPathname: input.toPathname,
      key: input.key,
      replace: input.replace,
      scroll: input.scroll,
      startedAt: Date.now(),
      snapshot: input.snapshot,
    });

    return id;
  }, []);

  const isCurrentTransition = useCallback((transitionId: number) => activeIdRef.current === transitionId, []);

  const cancelTransition = useCallback((transitionId?: number) => {
    if (transitionId && activeIdRef.current !== transitionId) {
      return;
    }

    activeIdRef.current = null;
    setActiveTransition(null);
    setPhase("idle");
  }, []);

  const finishTransition = useCallback((transitionId?: number) => {
    if (transitionId && activeIdRef.current !== transitionId) {
      return;
    }

    activeIdRef.current = null;
    setActiveTransition(null);
    setPhase("idle");
  }, []);

  const value = useMemo(
    () => ({
      activeTransition,
      phase,
      beginTransition,
      setPhase,
      isCurrentTransition,
      cancelTransition,
      finishTransition,
    }),
    [activeTransition, phase, beginTransition, isCurrentTransition, cancelTransition, finishTransition],
  );

  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}

export function usePageTransition() {
  const context = useContext(TransitionContext);

  if (!context) {
    throw new Error("usePageTransition must be used within PageTransitionProvider");
  }

  return context;
}
