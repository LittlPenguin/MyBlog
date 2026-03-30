"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type TransitionState = {
  href: string;
  key: string;
} | null;

type TransitionContextValue = {
  activeTransition: TransitionState;
  beginTransition: (href: string, key: string) => void;
  finishTransition: () => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [activeTransition, setActiveTransition] = useState<TransitionState>(null);

  const beginTransition = useCallback((href: string, key: string) => {
    setActiveTransition({ href, key });
  }, []);

  const finishTransition = useCallback(() => {
    setActiveTransition(null);
  }, []);

  const value = useMemo(
    () => ({
      activeTransition,
      beginTransition,
      finishTransition,
    }),
    [activeTransition, beginTransition, finishTransition],
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
