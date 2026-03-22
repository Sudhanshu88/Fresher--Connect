"use client";

import { CSSProperties, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { LiveUpdateItem, LiveUpdatesResponse } from "@/lib/types";

const REFRESH_INTERVAL_MS = 45000;

export function LiveUpdatesTicker() {
  const [updates, setUpdates] = useState<LiveUpdateItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUpdates() {
      try {
        const response = await apiRequest<LiveUpdatesResponse>("/api/live-updates?limit=12");
        if (!active) {
          return;
        }
        setUpdates(response.updates);
      } catch (_error) {
        if (!active) {
          return;
        }
        setUpdates((current) => current);
      } finally {
        if (active) {
          setHasLoaded(true);
        }
      }
    }

    void loadUpdates();
    const intervalId = window.setInterval(() => {
      void loadUpdates();
    }, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const tickerStyle = {
    "--ticker-duration": `${Math.max(18, updates.length * 5.5)}s`
  } as CSSProperties;

  return (
    <div className="container live-updates-shell">
      <section className="live-updates-card" aria-label="Live updates ticker">
        <div className="live-updates-label">Live Updates</div>
        <div className="live-updates-viewport">
          {updates.length ? (
            <div className="live-updates-track" style={tickerStyle}>
              <div className="live-updates-segment">
                {updates.map((update) => (
                  <article className="live-update-item" key={update.id}>
                    <span className={`live-update-badge ${update.type}`}>{update.type === "company" ? "Company" : "Job"}</span>
                    <span className="live-update-title">{update.title}</span>
                    <span className="live-update-separator" aria-hidden="true">
                      •
                    </span>
                    <span className="live-update-message">{update.message}</span>
                  </article>
                ))}
              </div>
              <div className="live-updates-segment" aria-hidden="true">
                {updates.map((update) => (
                  <article className="live-update-item" key={`duplicate-${update.id}`}>
                    <span className={`live-update-badge ${update.type}`}>{update.type === "company" ? "Company" : "Job"}</span>
                    <span className="live-update-title">{update.title}</span>
                    <span className="live-update-separator" aria-hidden="true">
                      •
                    </span>
                    <span className="live-update-message">{update.message}</span>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="live-updates-empty">
              {hasLoaded ? "Fresh companies and roles will appear here shortly." : "Loading the latest companies and roles..."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
