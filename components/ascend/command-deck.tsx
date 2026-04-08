"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ChevronRight,
  Cloud,
  Plus,
  Play,
  Sparkles,
  Trash2,
  WandSparkles,
  Zap,
} from "lucide-react";

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
  onCreatePath: (name: string, capstones: string) => void;
  onDeletePath: (pathId: string) => void;
  onOpenPath: () => void;
  onQuickLog: (minutes: number, activityTypeId: ActivityTypeId, note?: string) => void;
  onSelectPath: (path: PathDefinition) => void;
  onSendMagicLink: () => void;
  onSignOut: () => void;
  onStartTimer: () => void;
  paths: PathDefinition[];
  pathSignals: Record<PathId, PathSignal>;
  selectedActivityType: ActivityTypeId;
  selectedPath: PathDefinition;
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
  onCreatePath,
  onDeletePath,
  onOpenPath,
  onQuickLog,
  onSelectPath,
  onSendMagicLink,
  onSignOut,
  onStartTimer,
  paths,
  pathSignals,
  selectedActivityType,
  selectedPath,
  setSelectedActivityType,
  userEmail,
  timerRunning,
}: CommandDeckProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.5fr_0.85fr]">
      <div className="space-y-4">
        <Card className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.94),rgba(5,7,17,0.96))] p-0">
          <CardContent className="space-y-5 p-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
                Selected Tree
              </p>
              <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                {selectedPath.name}
              </h2>
              <p className="mt-2 text-sm text-slate-300">{selectedPath.overview}</p>
            </div>

            <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/8 p-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">
                <span>Deck Link</span>
                <span>{activeMissionName ? "Node bound" : "Tree draft"}</span>
              </div>
              <p className="mt-3 text-sm text-slate-200">
                {activeMissionName
                  ? `Current mission focus is ${activeMissionName}. Open the tree to route effort through its connected nodes.`
                  : "This tree is ready to be shaped. Add capstones or nodes, then enter the progression map."}
              </p>
              <Button
                className="mt-4 w-full rounded-full bg-white text-slate-950 hover:bg-slate-100"
                onClick={onOpenPath}
              >
                <ChevronRight className="size-4" />
                Open progression map
              </Button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
                <span>Mission charge</span>
                <span>{Math.round(activeMissionCharge * 100)}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(37,244,238,0.95),rgba(254,52,187,0.82))]"
                  style={{ width: `${Math.max(8, Math.round(activeMissionCharge * 100))}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
                <span>Path signal</span>
                <span>{pathSignals[selectedPath.id]?.completionText ?? "Blueprint forming"}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-2 flex-1 rounded-full bg-white/10",
                      index < (pathSignals[selectedPath.id]?.signalBars ?? 1) &&
                        "bg-[linear-gradient(90deg,rgba(37,244,238,0.9),rgba(254,52,187,0.8))]"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
                Quick Actions
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_TYPES.slice(0, 4).map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => setSelectedActivityType(activity.id)}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-left text-xs uppercase tracking-[0.18em] transition-colors",
                      selectedActivityType === activity.id
                        ? "border-cyan-300/60 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    )}
                  >
                    {activity.label}
                  </button>
                ))}
              </div>
              <Button
                className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
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
                  className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
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
                  ? `${latestSession.nodeName} logged for ${latestSession.minutes}m as ${latestSession.activityLabel}.`
                  : "Select a node and start feeding the tree with real sessions."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
            Command Deck
          </p>
          <h2 className="mt-2 font-heading text-3xl uppercase tracking-[0.14em] text-white">
            Choose the path you want to inhabit
          </h2>
        </div>

        <Card className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,26,0.95),rgba(5,7,15,0.98))] p-0 shadow-[0_0_80px_rgba(37,244,238,0.08)]">
          <CardContent className="relative min-h-[540px] overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,244,238,0.08),transparent_44%)]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/20 bg-[radial-gradient(circle,rgba(37,244,238,0.18),rgba(6,10,20,0.72)_60%,rgba(6,10,20,0)_100%)] shadow-[0_0_60px_rgba(37,244,238,0.18)]">
              <div className="space-y-1 text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">
                  Synaptic Core
                </div>
                <div className="font-heading text-xl uppercase tracking-[0.14em] text-white">
                  {selectedPath.name}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {pathSignals[selectedPath.id]?.completionText ?? "Blueprint forming"}
                </div>
              </div>
            </div>
            {paths.map((path) => {
              const signal = pathSignals[path.id];
              const selected = path.id === selectedPath.id;

              return (
                <motion.button
                  key={path.id}
                  type="button"
                  onClick={() => onSelectPath(path)}
                  whileHover={{ scale: 1.04, y: -4 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                  style={{ left: `${path.orbit.x}%`, top: `${path.orbit.y}%` }}
                >
                  <div
                    className={cn(
                      "flex min-h-[112px] min-w-[150px] max-w-[190px] flex-col justify-between rounded-[34px] border px-4 py-4 shadow-[0_0_35px_rgba(37,244,238,0.08)] backdrop-blur",
                      selected
                        ? "border-cyan-300/50 bg-slate-950/88"
                        : "border-white/10 bg-slate-950/72 hover:border-white/25"
                    )}
                  >
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
                        {path.kicker}
                      </div>
                      <div className="mt-2 font-heading text-lg uppercase tracking-[0.08em] text-white">
                        {path.name}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className={cn(
                              "h-1.5 flex-1 rounded-full bg-white/10",
                              index < (signal?.signalBars ?? 1) && `bg-gradient-to-r ${path.accent}`
                            )}
                          />
                        ))}
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        {signal?.completionText ?? "Blueprint forming"}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}

            <div className="absolute bottom-4 left-1/2 w-3/5 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-xs uppercase tracking-[0.28em] text-slate-400">
              Select a tree to preview it here. Open the progression map when you want to work inside it.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="rounded-[30px] border border-white/10 bg-slate-950/76 p-0">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
                Tree Controls
              </p>
              <h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                Curate your world map
              </h3>
            </div>

            <AddTreeForm onCreatePath={onCreatePath} />

            <Button
              variant="outline"
              className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => onDeletePath(selectedPath.id)}
              disabled={selectedPath.id === "athletics"}
            >
              <Trash2 className="size-4" />
              Delete selected tree
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border border-cyan-400/15 bg-cyan-400/8 p-0">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.34em] text-cyan-200/85">
              <Cloud className="size-4" />
              Sync
            </div>
            <p className="text-sm text-slate-200">
              {authStatus === "synced"
                ? `Connected as ${userEmail}. Progress syncs across devices.`
                : authStatus === "syncing"
                  ? "Sync in progress. Pulling your latest state from Supabase."
                  : authStatus === "offline"
                    ? "Supabase is not configured in this environment."
                    : "Using local progress for now. Sign in to sync across devices."}
            </p>

            {authStatus !== "synced" ? (
              <div className="space-y-2">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => onAuthEmailChange(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <Button
                  className="w-full rounded-full bg-white text-slate-950 hover:bg-slate-100"
                  onClick={onSendMagicLink}
                  disabled={!authEmail}
                >
                  <Sparkles className="size-4" />
                  Send magic link
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={onSignOut}
              >
                Sign out
              </Button>
            )}

            {authMessage ? <p className="text-xs text-cyan-200/80">{authMessage}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddTreeForm({
  onCreatePath,
}: {
  onCreatePath: (name: string, capstones: string) => void;
}) {
  return (
    <form
      className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = String(formData.get("name") ?? "").trim();
        const capstones = String(formData.get("capstones") ?? "").trim();

        if (!name) {
          return;
        }

        onCreatePath(name, capstones);
        event.currentTarget.reset();
      }}
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">
        Add new tree
      </div>
      <input
        name="name"
        placeholder="Skill tree name"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
      />
      <textarea
        name="capstones"
        rows={3}
        placeholder="Capstones, comma separated"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
      />
      <Button className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">
        <Plus className="size-4" />
        Add skill tree
      </Button>
      <p className="text-xs text-slate-400">
        Include capstones to auto-generate a first-pass structure.
      </p>
      <div className="text-xs text-cyan-200/80">
        <WandSparkles className="mr-1 inline size-3" />
        AI generation can later replace this deterministic starter layout.
      </div>
    </form>
  );
}
