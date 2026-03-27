import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    autocapture: false,
  });
  initialized = true;
}

export const analytics = {
  capture(event: string, properties?: Record<string, unknown>) {
    try {
      posthog.capture(event, properties);
    } catch {}
  },
  identify(userId: string, properties?: Record<string, unknown>) {
    try {
      posthog.identify(userId, properties);
    } catch {}
  },
  page() {
    try {
      posthog.capture("$pageview");
    } catch {}
  },
};

export default analytics;
