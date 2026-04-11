"use client";

import { type ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Play, Plus, Sparkles, Trash2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ACTIVITY_TYPES, type ActivityTypeId, type PathDefinition, type PathId, type SessionLog } from "@/lib/ascend-data";
import { type MomentumSummary, type PathMissionSummary, type TodayRecommendation } from "@/lib/ascend-engine";
import { cn } from "@/lib/utils";

type PathSignal = {
  completionText: string;
  signalBars: number;
  glowStrength: number;
  activeNodes: number;
};

type CommandDeckCompactProps = {
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
  onEnterPath: (path: PathDefinition) => void;
  onQuickLog: (minutes: number, activityTypeId: ActivityTypeId, note?: string) => void;
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

export function CommandDeckCompact({
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
  onEnterPath,
  onQuickLog,
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
}: CommandDeckCompactProps) {
  const [open, setOpen] = useState<"today" | "manage" | "sync" | null>("today");

  return (
    <div className="space-y-4">
      <Card className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.98),rgba(4,7,16,0.96))] p-0">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/70">Launch</div>
              <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white sm:text-3xl">Pick a tree. Get to work.</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <MetricPill label="Today" value={momentumSummary.activeToday ? "On" : "Off"} />
              <MetricPill label="Days" value={`${momentumSummary.recentDaysActive}`} />
              <MetricPill label="Logs" value={`${momentumSummary.recentTransmissions}`} />
              <MetricPill label="Clears" value={`${momentumSummary.weeklyCompletions}`} />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {paths.map((path, index) => {
                const signal = pathSignals[path.id];
                const selected = path.id === selectedPath.id;

                return (
                  <motion.button
                    key={path.id}
                    type="button"
                    onClick={() => onEnterPath(path)}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: index * 0.04 }}
                    whileHover={{ y: -4 }}
                    className={cn("rounded-[24px] border px-4 py-4 text-left transition-colors", selected ? "border-cyan-300/45 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:border-cyan-300/25")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">{path.kicker}</div>
                        <div className="mt-2 font-heading text-xl uppercase tracking-[0.08em] text-white">{path.name}</div>
                      </div>
                      <ChevronRight className="size-4 text-slate-500" />
                    </div>
                    <div className="mt-4 flex gap-1.5">
                      {Array.from({ length: 4 }).map((_, barIndex) => (
                        <div key={barIndex} className={cn("h-1.5 flex-1 rounded-full bg-white/10", barIndex < (signal?.signalBars ?? 1) && `bg-gradient-to-r ${path.accent}`)} />
                      ))}
                    </div>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">{signal?.completionText ?? "Blueprint"}</div>
                  </motion.button>
                );
              })}
            </div>

            <div className="rounded-[24px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(8,15,28,0.98),rgba(5,8,16,0.94))] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">Focus</div>
              <div className="mt-3 font-heading text-xl uppercase tracking-[0.08em] text-white">{activeMissionName ?? "No node selected"}</div>
              <div className="mt-1 text-sm text-slate-300">{latestSession ? `${latestSession.minutes}m logged on ${latestSession.nodeTitle}.` : "Enter a tree and pick a node."}</div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(37,244,238,0.95),rgba(254,52,187,0.82))]" style={{ width: `${Math.max(8, Math.round(activeMissionCharge * 100))}%` }} />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={onStartTimer} disabled={!activeMissionName || timerRunning}>
                  <Play className="size-4" />
                  {timerRunning ? "Timer on" : "Start timer"}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_LOG_MINUTES.map((minutes) => (
                    <Button key={minutes} variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => onQuickLog(minutes, selectedActivityType)} disabled={!activeMissionName}>
                      <Zap className="size-4" />
                      {minutes}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {ACTIVITY_TYPES.slice(0, 3).map((activity) => (
                  <button key={activity.id} type="button" onClick={() => setSelectedActivityType(activity.id)} className={cn("rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em]", selectedActivityType === activity.id ? "border-cyan-300/50 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-400")}>
                    {activity.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 xl:grid-cols-3">
        <Disclosure title="Next moves" label="Today" open={open === "today"} onToggle={() => setOpen(open === "today" ? null : "today")}>
          <div className="space-y-2">
            {todayRecommendations.slice(0, 4).map((item) => (
              <button key={item.id} type="button" onClick={() => onEnterPath(paths.find((path) => path.id === item.pathId) ?? selectedPath)} className="flex w-full items-center justify-between rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-cyan-300/25">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">{item.pathName}</div>
                  <div className="mt-1 text-sm text-white">{item.nodeTitle}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.action}</div>
                </div>
                <ChevronRight className="size-4 text-slate-500" />
              </button>
            ))}
          </div>
        </Disclosure>
        <Disclosure title="Trees" label="Manage" open={open === "manage"} onToggle={() => setOpen(open === "manage" ? null : "manage")}>
          <div className="space-y-3">
            {missionSummaries.slice(0, 4).map((item) => <div key={item.nodeId} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">{item.pathName}: {item.nodeTitle}</div>)}
            <AddTreeForm onCreatePath={onCreatePath} />
            <Button variant="outline" className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => onDeletePath(selectedPath.id)} disabled={selectedPath.id === "athletics"}>
              <Trash2 className="size-4" />
              Delete current tree
            </Button>
          </div>
        </Disclosure>
        <Disclosure title={authStatus === "synced" ? "Connected" : "Account"} label="Sync" open={open === "sync"} onToggle={() => setOpen(open === "sync" ? null : "sync")}>
          <div className="space-y-3">
            <div className="text-sm text-slate-300">{authStatus === "synced" ? userEmail : authStatus === "syncing" ? "Syncing..." : authStatus === "offline" ? "Supabase unavailable" : "Local only"}</div>
            {authStatus !== "synced" ? (
              <div className="space-y-2">
                <input type="email" value={authEmail} onChange={(event) => onAuthEmailChange(event.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
                <Button className="w-full rounded-full bg-white text-slate-950 hover:bg-slate-100" onClick={onSendMagicLink} disabled={!authEmail}>
                  <Sparkles className="size-4" />
                  Send link
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onSignOut}>Sign out</Button>
            )}
            {authMessage ? <div className="text-xs text-cyan-200/80">{authMessage}</div> : null}
          </div>
        </Disclosure>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2"><div className="text-[10px] text-slate-500">{label}</div><div className="mt-1 font-heading text-sm uppercase tracking-[0.08em] text-white">{value}</div></div>;
}

function Disclosure({ children, label, title, open, onToggle }: { children: ReactNode; label: string; title: string; open: boolean; onToggle: () => void }) {
  return <Card className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96),rgba(5,7,16,0.93))] p-0"><CardContent className="p-3"><button type="button" onClick={onToggle} className="flex w-full items-center justify-between rounded-[20px] px-2 py-2 text-left"><div><div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div><div className="mt-1 font-heading text-lg uppercase tracking-[0.08em] text-white">{title}</div></div><motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="size-4 text-slate-500" /></motion.div></button><AnimatePresence initial={false}>{open ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"><div className="px-2 pb-2 pt-1">{children}</div></motion.div> : null}</AnimatePresence></CardContent></Card>;
}

function AddTreeForm({ onCreatePath }: { onCreatePath: (name: string, capstones: string) => void }) {
  return <form className="space-y-3 rounded-[20px] border border-white/10 bg-white/5 p-4" onSubmit={(event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); const name = String(formData.get("name") ?? "").trim(); const capstones = String(formData.get("capstones") ?? "").trim(); if (!name) { return; } onCreatePath(name, capstones); event.currentTarget.reset(); }}><div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">New tree</div><input name="name" placeholder="Name" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" /><input name="capstones" placeholder="Capstones, comma separated" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" /><Button className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Plus className="size-4" />Create</Button></form>;
}
