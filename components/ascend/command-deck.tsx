"use client";

import { motion } from "framer-motion";
import { Activity, ChevronRight, Cloud, Play, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ACTIVITY_TYPES,
  type ActivityTypeId,
  type PathDefinition,
  type PathId,
  type SessionLog,
} from "@/lib/ascend-data";
import { cn } from "@/lib/utils";

type PathSignal = {
  completionText: string;
  signalBars: number;
  glowStrength: number;
  activeNodes: number;
};

type CommandDeckProps = {
  authEmail: string;
  authMessage: string | null;
  authStatus: "offline" | "local" | "syncing" | "synced";
  activeMissionCharge: number;
  activeMissionName: string | null;
  latestSession?: SessionLog;
  onAuthEmailChange: (email: string) => void;
  onOpenPath: (path: PathDefinition) => void;
  onQuickLog: (minutes: number, activityTypeId: ActivityTypeId) => void;
  onSendMagicLink: () => void;
  onSignOut: () => void;
  onStartTimer: () => void;
  paths: PathDefinition[];
  pathSignals: Record<PathId, PathSignal>;
  selectedActivityType: ActivityTypeId;
  setSelectedActivityType: (activityTypeId: ActivityTypeId) => void;
  userEmail: string | null;
  timerRunning: boolean;
};

const QUICK_LOG_MINUTES = [15, 30, 45] as const;

export function CommandDeck({
  authEmail,
  authMessage,
  authStatus,
  activeMissionCharge,
  activeMissionName,
  latestSession,
  onAuthEmailChange,
  onOpenPath,
  onQuickLog,
  onSendMagicLink,
  onSignOut,
  onStartTimer,
  paths,
  pathSignals,
  selectedActivityType,
  setSelectedActivityType,
  userEmail,
  timerRunning,
}: CommandDeckProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
              Command Deck
            </p>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.14em] text-white">
              Select your active path
            </h2>
          </div>
          <div className="hidden rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-fuchsia-200 sm:block">
            Five-path MVP loaded
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paths.map((path) => {
            const signal = pathSignals[path.id];

            return (
              <motion.button
                key={path.id}
                whileHover={{ y: -6, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onOpenPath(path)}
                className="text-left"
              >
                <Card
                  className="min-h-[230px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,32,0.95),rgba(6,9,20,0.88))] p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_60px_rgba(1,8,20,0.55)] transition-colors hover:border-cyan-300/40"
                  style={{
                    boxShadow: `0 0 30px rgba(37, 244, 238, ${0.08 + signal.glowStrength * 0.18})`,
                  }}
                >
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-400">
                          {path.kicker}
                        </span>
                        <ChevronRight className="size-4 text-cyan-300/80" />
                      </div>

                      <div>
                        <h3 className="font-heading text-2xl uppercase tracking-[0.12em] text-white">
                          {path.name}
                        </h3>
                        <p className="mt-2 max-w-[24ch] text-sm text-slate-300">
                          {path.summary}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className={cn(
                              "h-2 flex-1 rounded-full bg-white/10",
                              index < signal.signalBars &&
                                "bg-[linear-gradient(90deg,rgba(37,244,238,0.85),rgba(254,52,187,0.8))]"
                            )}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                        <span>{signal.completionText}</span>
                        <span>{signal.activeNodes} energized nodes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}
        </div>
      </div>

      <aside className="space-y-4">
        <Card className="rounded-[28px] border border-cyan-400/20 bg-slate-950/70 p-0 shadow-[0_0_55px_rgba(37,244,238,0.08)] backdrop-blur">
          <CardContent className="space-y-5 p-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
                Quick Actions
              </p>
              <h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                Keep momentum visible
              </h3>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">
                Active Mission
              </div>
              <div className="mt-2 font-heading text-xl uppercase tracking-[0.1em] text-white">
                {activeMissionName ?? "Awaiting target lock"}
              </div>
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-2 flex-1 rounded-full bg-white/10",
                      index < Math.max(1, Math.ceil(activeMissionCharge * 5)) &&
                        "bg-cyan-300"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">
                Activity Modifier
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_TYPES.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => setSelectedActivityType(activity.id)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition-colors",
                      selectedActivityType === activity.id
                        ? "border-cyan-300/60 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    )}
                  >
                    <div className="text-xs uppercase tracking-[0.2em]">
                      {activity.label}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {activity.multiplier.toFixed(2)}x signal
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-full bg-cyan-300 px-4 text-slate-950 hover:bg-cyan-200"
                onClick={onStartTimer}
                disabled={!activeMissionName || timerRunning}
              >
                <Play className="size-4" />
                {timerRunning ? "Timer live" : "Start timer"}
              </Button>
              {QUICK_LOG_MINUTES.map((minutes) => (
                <Button
                  key={minutes}
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => onQuickLog(minutes, selectedActivityType)}
                  disabled={!activeMissionName}
                >
                  <Zap className="size-4" />
                  Log {minutes}m
                </Button>
              ))}
            </div>

            <div className="rounded-3xl border border-fuchsia-400/15 bg-fuchsia-500/8 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.34em] text-fuchsia-200/80">
                <Activity className="size-4" />
                Recent transmission
              </div>
              <p className="mt-3 text-sm text-slate-200">
                {latestSession
                  ? `${latestSession.nodeName} logged for ${latestSession.minutes}m as ${latestSession.activityLabel}. Progress registered.`
                  : "No sessions recorded yet. Select a mission and register the first run."}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/8 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.34em] text-cyan-200/85">
                <Cloud className="size-4" />
                Sync
              </div>
              <p className="mt-3 text-sm text-slate-200">
                {authStatus === "synced"
                  ? `Connected as ${userEmail}. Progress now syncs across devices.`
                  : authStatus === "syncing"
                    ? "Sync in progress. Pulling your latest state from Supabase."
                    : authStatus === "offline"
                      ? "Supabase is not configured locally yet."
                      : "Using local progress for now. Sign in to sync across devices."}
              </p>

              {authStatus !== "synced" ? (
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => onAuthEmailChange(event.target.value)}
                    placeholder="you@example.com"
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <Button
                    className="rounded-full bg-white text-slate-950 hover:bg-slate-100"
                    onClick={onSendMagicLink}
                    disabled={!authEmail}
                  >
                    Send magic link
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mt-3 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={onSignOut}
                >
                  Sign out
                </Button>
              )}

              {authMessage ? (
                <p className="mt-3 text-xs text-cyan-200/80">{authMessage}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
