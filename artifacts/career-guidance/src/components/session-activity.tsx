import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCareerStore } from "@/store/use-career-store";

const IDLE_MS = 15 * 60 * 1000;
const IDLE_CHECK_MS = 30_000;
const PING_MS = 3 * 60 * 1000;

/**
 * Logs out after 15 minutes of no pointer/keyboard/scroll activity.
 * While active, pings /api/auth/ping so the rolling session cookie stays valid.
 */
export function SessionActivity() {
  const user = useCareerStore((s) => s.user);
  const setUser = useCareerStore((s) => s.setUser);
  const clearProfile = useCareerStore((s) => s.clearProfile);
  const [, setLocation] = useLocation();
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    const bump = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const idleId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivityRef.current > IDLE_MS) {
        fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
          setUser(null);
          clearProfile();
          setLocation("/login?reason=idle");
        });
      }
    }, IDLE_CHECK_MS);

    const pingId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivityRef.current < IDLE_MS) {
        fetch("/api/auth/ping", { credentials: "include" }).catch(() => {});
      }
    }, PING_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(idleId);
      window.clearInterval(pingId);
    };
  }, [user, setUser, clearProfile, setLocation]);

  return null;
}
