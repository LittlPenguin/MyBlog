"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type TransitionState = {
  id: number;
  href: string;
  fromPathname: string;
  toPathname: string;
  key: string;
  replace: boolean;
  scroll: boolean;
} | null;

export type TransitionPhase = "idle" | "exiting" | "entering";

type BeginTransitionInput = {
  href: string;
  fromPathname: string;
  toPathname: string;
  key: string;
  replace: boolean;
  scroll: boolean;
};

type TransitionContextValue = {
  activeTransition: TransitionState;
  phase: TransitionPhase;
  beginTransition: (input: BeginTransitionInput) => number;
  setPhase: (phase: TransitionPhase) => void;
  cancelTransition: (transitionId?: number) => void;
  finishTransition: (transitionId?: number) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [activeTransition, setActiveTransition] = useState<TransitionState>(null);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const sequenceRef = useRef(0);

  const beginTransition = useCallback((input: BeginTransitionInput) => {
    sequenceRef.current += 1;
    const id = sequenceRef.current;

    setPhase("exiting");
    setActiveTransition({
      id,
      href: input.href,
      fromPathname: input.fromPathname,
      toPathname: input.toPathname,
      key: input.key,
      replace: input.replace,
      scroll: input.scroll,
    });

    return id;
  }, []);

  const cancelTransition = useCallback((transitionId?: number) => {
    setActiveTransition((current) => {
      if (transitionId && current && current.id !== transitionId) {
        return current;
      }

      return null;
    });
    setPhase("idle");
  }, []);

  const finishTransition = useCallback((transitionId?: number) => {
    setActiveTransition((current) => {
      if (transitionId && current && current.id !== transitionId) {
        return current;
      }

      return null;
    });
    setPhase("idle");
  }, []);

  const value = useMemo(
    () => ({
      activeTransition,
      phase,
      beginTransition,
      setPhase,
      cancelTransition,
      finishTransition,
    }),
    [activeTransition, phase, beginTransition, cancelTransition, finishTransition],
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
