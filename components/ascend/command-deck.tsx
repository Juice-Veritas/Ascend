"use client";

import { type ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ChevronDown,
  ChevronRight,
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
import {
  type MomentumSummary,
  type PathMissionSummary,
  type TodayRecommendation,
} from "@/lib/ascend-engine";
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
  missionSummaries: PathMissionSummary[];
  momentumSummary: MomentumSummary;
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
  todayRecommendations: TodayRecommendation[];
  userEmail: string | null;
  timerRunning: boolean;
};

const QUICK_LOG_MINUTES = [15, 30, 45] as const;

function getOrbitPlacement(index: number, total: number) {
  const primarySlots = [
    { left: 50, top: 18 },
    { left: 76, top: 34 },
    { left: 68, top: 68 },
    { left: 32, top: 68 },
    { left: 24, top: 34 },
    { left: 50, top: 82 },
  ];

  if (index < primarySlots.length) {
    return primarySlots[index];
  }

  const overflowIndex = index - primarySlots.length;
  const overflowTotal = Math.max(1, total - primarySlots.length);
  const angle = (-90 + (360 / overflowTotal) * overflowIndex) * (Math.PI / 180);
  const radiusX = 39;
  const radiusY = 28;

  return {
    left: 50 + Math.cos(angle) * radiusX,
    top: 48 + Math.sin(angle) * radiusY,
  };
}

export function CommandDeck({
  authEmail,
  authMessage,
  authStatus,
  activeMissionCharge,
  activeMissionName,
  latestSession,
  missionSummaries,
  momentumSummary,
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
  todayRecommendations,
  userEmail,
  timerRunning,
}: CommandDeckProps) {
  const [openPanel, setOpenPanel] = useState<"overview" | "actions" | "controls" | "sync">("overview");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
      }}
      className="grid gap-6 xl:grid-cols-[0.72fr_1.55fr_0.72fr]"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45 }}
        className="space-y-3"
      >
        <DrawerCard
          label="Selected Tree"
          title={selectedPath.name}
          open={openPanel === "overview"}
          onToggle={() => setOpenPanel(openPanel === "overview" ? "actions" : "overview")}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-300">{selectedPath.overview}</p>
            <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/8 p-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">
                <span>{activeMissionName ? "Mission bound" : "Draft tree"}</span>
                <span>{Math.round(activeMissionCharge * 100)}%</span>
              </div>
              <p className="mt-3 text-sm text-slate-200">
                {activeMissionName
                  ? `${activeMissionName} is currently bound to this tree.`
                  : "This tree is ready to be shaped when you want to define the route."}
              </p>
              <Button
                className="mt-4 w-full rounded-full bg-white text-slate-950 hover:bg-slate-100"
                onClick={onOpenPath}
              >
                <ChevronRight className="size-4" />
                Open progression map
              </Button>
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
            <div className="rounded-3xl border border-fuchsia-400/15 bg-fuchsia-500/8 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.34em] text-fuchsia-200/80">
                <Activity className="size-4" />
                Recent transmission
              </div>
              <p className="mt-3 text-sm text-slate-200">
                {latestSession
                  ? `${latestSession.nodeTitle} logged for ${latestSession.minutes}m as ${latestSession.activityLabel}.`
                  : "Select a node and start feeding the tree with real sessions."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TelemetryTile label="Today" value={momentumSummary.activeToday ? "Active" : "Quiet"} />
              <TelemetryTile label="7-day momentum" value={`${momentumSummary.recentDaysActive} days`} />
              <TelemetryTile label="Recent transmissions" value={`${momentumSummary.recentTransmissions}`} />
              <TelemetryTile label="Weekly completions" value={`${momentumSummary.weeklyCompletions}`} />
            </div>
          </div>
        </DrawerCard>

        <DrawerCard
          label="Quick Actions"
          title="Launch Session"
          open={openPanel === "actions"}
          onToggle={() => setOpenPanel(openPanel === "actions" ? "overview" : "actions")}
        >
          <div className="space-y-4">
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
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LOG_MINUTES.map((minutes) => (
                <Button
                  key={minutes}
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => onQuickLog(minutes, selectedActivityType)}
                  disabled={!activeMissionName}
                >
                  <Zap className="size-4" />
                  {minutes}m
                </Button>
              ))}
            </div>
          </div>
        </DrawerCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, delay: 0.04 }}
        className="space-y-4"
      >
        <Card className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,26,0.95),rgba(5,7,15,0.98))] p-0 shadow-[0_0_80px_rgba(37,244,238,0.08)]">
          <CardContent className="relative min-h-[540px] overflow-hidden p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,244,238,0.08),transparent_44%)]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/20 bg-[radial-gradient(circle,rgba(37,244,238,0.16),rgba(6,10,20,0.7)_60%,rgba(6,10,20,0)_100%)] shadow-[0_0_50px_rgba(37,244,238,0.14)]">
              <div className="space-y-1 text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">
                  Core
                </div>
                <div className="font-heading text-lg uppercase tracking-[0.12em] text-white">
                  {selectedPath.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  {pathSignals[selectedPath.id]?.completionText ?? "Blueprint forming"}
                </div>
              </div>
            </div>
            {paths.map((path) => {
              const signal = pathSignals[path.id];
              const selected = path.id === selectedPath.id;
              const placement = getOrbitPlacement(paths.findIndex((item) => item.id === path.id), paths.length);

              return (
                <motion.button
                  key={path.id}
                  type="button"
                  onClick={() => onSelectPath(path)}
                  whileHover={{ scale: 1.03, y: -6 }}
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.04 * paths.findIndex((item) => item.id === path.id) }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                  style={{ left: `${placement.left}%`, top: `${placement.top}%` }}
                >
                  <div
                    className={cn(
                      "flex min-h-[96px] min-w-[136px] max-w-[164px] flex-col justify-between rounded-[28px] border px-3.5 py-3 shadow-[0_0_30px_rgba(37,244,238,0.08)] backdrop-blur",
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

            <div className="absolute bottom-4 left-1/2 w-[70%] -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-[10px] uppercase tracking-[0.28em] text-slate-400">
              Select a tree, preview it, then enter the map.
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[34px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(7,11,22,0.96),rgba(5,7,16,0.94))] p-0">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/70">Today Engine</div>
                <div className="mt-1 font-heading text-2xl uppercase tracking-[0.1em] text-white">Best current moves</div>
              </div>
              <div className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-cyan-200/80">
                {todayRecommendations.length} surfaced
              </div>
            </div>
            <div className="space-y-3">
              {todayRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/75">{recommendation.pathName}</div>
                    <div className="rounded-full border border-fuchsia-300/15 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-fuchsia-100">{recommendation.reasonLabel}</div>
                  </div>
                  <div className="mt-2 font-heading text-lg uppercase tracking-[0.08em] text-white">{recommendation.nodeTitle}</div>
                  <div className="mt-2 text-sm text-slate-200">{recommendation.action}</div>
                  <div className="mt-2 text-xs text-slate-400">{recommendation.context}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="space-y-3"
      >
        <DrawerCard
          label="Tree Controls"
          title="Edit Deck"
          open={openPanel === "controls"}
          onToggle={() => setOpenPanel(openPanel === "controls" ? "sync" : "controls")}
        >
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">Cross-path missions</div>
              <div className="mt-3 space-y-3">
                {missionSummaries.map((mission) => (
                  <div key={mission.nodeId} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">{mission.pathName}</span>
                      <span className="text-[11px] text-slate-400">{mission.statusLabel}</span>
                    </div>
                    <div className="mt-2 font-medium text-white">{mission.nodeTitle}</div>
                    <div className="mt-1 text-xs text-slate-400">{mission.action}</div>
                  </div>
                ))}
              </div>
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
          </div>
        </DrawerCard>

        <DrawerCard
          label="Sync"
          title={authStatus === "synced" ? "Connected" : "Account"}
          open={openPanel === "sync"}
          onToggle={() => setOpenPanel(openPanel === "sync" ? "controls" : "sync")}
          tone="cyan"
        >
          <div className="space-y-4">
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
          </div>
        </DrawerCard>
      </motion.div>
    </motion.div>
  );
}

function TelemetryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-2 font-heading text-lg uppercase tracking-[0.08em] text-white">{value}</div>
    </div>
  );
}

function DrawerCard({
  children,
  label,
  title,
  open,
  onToggle,
  tone = "default",
}: {
  children: ReactNode;
  label: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  tone?: "default" | "cyan";
}) {
  return (
    <Card
      className={cn(
        "rounded-[30px] border p-0",
        tone === "cyan"
          ? "border-cyan-400/15 bg-cyan-400/8"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.94),rgba(5,7,17,0.96))]"
      )}
    >
      <CardContent className="p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between rounded-[22px] px-2 py-2 text-left"
        >
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/70">{label}</div>
            <div className="mt-1 font-heading text-xl uppercase tracking-[0.1em] text-white">{title}</div>
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronDown className="size-5 text-slate-400" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-4 px-2 pb-2 pt-1">{children}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
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
