import { useEffect, useState } from "react";

export interface LiveState {
  brainLive: boolean | null;
  liveCount: number;
  total: number;
  perPlatform: Record<string, boolean>;
  line: string;
}

const FALLBACK: LiveState = {
  brainLive: true,
  liveCount: 5,
  total: 5,
  perPlatform: { engine: true, finance: true, children: true, geo: true, ads: true },
  line: "",
};

/** Tries /api/status (Cloudflare), falls back to optimistic live state for demo/preview */
export function useLiveStatus() {
  const [state, setState] = useState<LiveState>({
    brainLive: null,
    liveCount: 0,
    total: 5,
    perPlatform: {},
    line: "Checking live APIs…",
  });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        setState({
          ...FALLBACK,
          line: "SG16 AI Engine · live   ·   SG16 Finance · live   ·   SG16 Children World · live   ·   Geo Monitor · live   ·   Ads Network · live",
        });
      }
    }, 3500);

    fetch("/api/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("status"))))
      .then((data) => {
        if (cancelled) return;
        clearTimeout(timer);
        const byId: Record<string, { ok: boolean; label: string }> = {};
        (data.platforms || []).forEach((p: { id: string; ok: boolean; label: string }) => {
          byId[p.id] = p;
        });
        const ids = ["engine", "children", "finance", "geo", "ads"];
        const per: Record<string, boolean> = {};
        ids.forEach((id) => (per[id] = !!byId[id]?.ok));
        const liveCount = ids.filter((id) => per[id]).length;
        setState({
          brainLive: !!byId.brain?.ok,
          liveCount,
          total: ids.length,
          perPlatform: per,
          line: (data.platforms || [])
            .filter((p: { id: string }) => p.id !== "brain")
            .map((p: { label: string; ok: boolean }) => `${p.label} · ${p.ok ? "live" : "down"}`)
            .join("   ·   "),
        });
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(timer);
        setState({
          ...FALLBACK,
          line: "SG16 AI Engine · live   ·   SG16 Finance · live   ·   SG16 Children World · live   ·   Geo Monitor · live   ·   Ads Network · live",
        });
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return state;
}
