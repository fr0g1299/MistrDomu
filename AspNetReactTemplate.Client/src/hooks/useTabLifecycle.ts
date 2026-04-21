import { useEffect, useRef, useState } from "react";

export type TabLifecycleEventType =
  | "visibilitychange"
  | "pagehide"
  | "pageshow"
  | "freeze"
  | "resume"
  | "online"
  | "offline";

export type TabLifecycleState = {
  visibilityState: DocumentVisibilityState | "unknown";
  isVisible: boolean;
  isOnline: boolean;
  isFrozen: boolean;
  lastEvent: TabLifecycleEventType | null;
  lastChangedAt: number | null;
};

export type TabLifecycleHandlers = Partial<{
  visibilitychange: (state: TabLifecycleState) => void;
  pagehide: (state: TabLifecycleState, event: PageTransitionEvent) => void;
  pageshow: (state: TabLifecycleState, event: PageTransitionEvent) => void;
  freeze: (state: TabLifecycleState) => void;
  resume: (state: TabLifecycleState) => void;
  online: (state: TabLifecycleState) => void;
  offline: (state: TabLifecycleState) => void;
}>;

const getInitialState = (): TabLifecycleState => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      visibilityState: "unknown",
      isVisible: true,
      isOnline: true,
      isFrozen: false,
      lastEvent: null,
      lastChangedAt: null,
    };
  }

  return {
    visibilityState: document.visibilityState,
    isVisible: document.visibilityState === "visible",
    isOnline: navigator.onLine,
    isFrozen: false,
    lastEvent: null,
    lastChangedAt: null,
  };
};

export function useTabLifecycle(handlers: TabLifecycleHandlers = {}) {
  const [state, setState] = useState<TabLifecycleState>(getInitialState);
  const handlersRef = useRef(handlers);
  const stateRef = useRef(state);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const updateState = (
      eventType: TabLifecycleEventType,
      nextState: Partial<TabLifecycleState>,
    ) => {
      setState((current) => ({
        ...current,
        ...nextState,
        lastEvent: eventType,
        lastChangedAt: Date.now(),
      }));
    };

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      const nextState = {
        ...stateRef.current,
        visibilityState: document.visibilityState,
        isVisible,
        isFrozen: false,
        lastEvent: "visibilitychange" as const,
        lastChangedAt: Date.now(),
      };

      updateState("visibilitychange", {
        visibilityState: document.visibilityState,
        isVisible,
        isFrozen: false,
      });

      handlersRef.current.visibilitychange?.(nextState);
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      const nextState = {
        ...stateRef.current,
        visibilityState: "hidden" as const,
        isVisible: false,
        isFrozen: false,
        lastEvent: "pagehide" as const,
        lastChangedAt: Date.now(),
      };

      updateState("pagehide", {
        visibilityState: "hidden",
        isVisible: false,
        isFrozen: false,
      });

      handlersRef.current.pagehide?.(nextState, event);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      const nextState = {
        ...stateRef.current,
        visibilityState: "visible" as const,
        isVisible: true,
        isFrozen: false,
        lastEvent: "pageshow" as const,
        lastChangedAt: Date.now(),
      };

      updateState("pageshow", {
        visibilityState: "visible",
        isVisible: true,
        isFrozen: false,
      });

      handlersRef.current.pageshow?.(nextState, event);
    };

    const handleFreeze = () => {
      const nextState = {
        ...stateRef.current,
        isFrozen: true,
        lastEvent: "freeze" as const,
        lastChangedAt: Date.now(),
      };

      updateState("freeze", {
        isFrozen: true,
      });

      handlersRef.current.freeze?.(nextState);
    };

    const handleResume = () => {
      const nextState = {
        ...stateRef.current,
        isFrozen: false,
        visibilityState: document.visibilityState,
        isVisible: document.visibilityState === "visible",
        lastEvent: "resume" as const,
        lastChangedAt: Date.now(),
      };

      updateState("resume", {
        isFrozen: false,
        visibilityState: document.visibilityState,
        isVisible: document.visibilityState === "visible",
      });

      handlersRef.current.resume?.(nextState);
    };

    const handleOnline = () => {
      const nextState = {
        ...stateRef.current,
        isOnline: true,
        lastEvent: "online" as const,
        lastChangedAt: Date.now(),
      };

      updateState("online", {
        isOnline: true,
      });

      handlersRef.current.online?.(nextState);
    };

    const handleOffline = () => {
      const nextState = {
        ...stateRef.current,
        isOnline: false,
        lastEvent: "offline" as const,
        lastChangedAt: Date.now(),
      };

      updateState("offline", {
        isOnline: false,
      });

      handlersRef.current.offline?.(nextState);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("freeze", handleFreeze as EventListener);
    window.addEventListener("resume", handleResume as EventListener);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("freeze", handleFreeze as EventListener);
      window.removeEventListener("resume", handleResume as EventListener);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return state;
}
