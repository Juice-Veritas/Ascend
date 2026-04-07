"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Pause, Play, RotateCcw, Sparkles } from "lucide-react";

import { ActiveMissionPanel } from "@/components/ascend/active-mission-panel";
import { SkillTreeCanvas } from "@/components/ascend/skill-tree-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ACTIVITY_TYPES,
  type ActivityTypeId,
  type PathDefinition,
  type SessionLog,
  type SkillNode,
} from "@/lib/ascend-data";
import {
  formatDuration,
  getNodeState,
  getVisibleProgressLabel,
} from "@/lib/ascend-engine";
import { cn } from "@/lib/utils";

type SkillTreeScreenProps = {
  activeMissionId: string;
  elapsedSeconds: number;
  latestSession?: SessionLog;
  onBack: () => void;
  onCommitTimerSession: () => void;
  onQuickLog: (minutes: number, activityTypeId: ActivityTypeId) => void;
  onResetTimer: () => void;
  onSelectMission: (nodeId: string) => void;
  onToggleTimer: () => void;
  selectedActivityType: ActivityTypeId;
  selectedPath: PathDefinition;
  sessionFeed: SessionLog[];
  setSelectedActivityType: (activityTypeId: ActivityTypeId) => void;
  timerRunning: boolean;
  tree: SkillNode[];
  xpByNode: Record<string, number>;
};

export function SkillTreeScreen({
  activeMissionId,
  elapsedSeconds,
  latestSession,
  onBack,
  onCommitTimerSession,
  onQuickLog,
  onResetTimer,
  onSelectMission,
  onToggleTimer,
  selectedActivityType,
  selectedPath,
  sessionFeed,
  setSelectedActivityType,
  timerRunning,
  tree,
  xpByNode,
}: SkillTreeScreenProps) {
  const activeMission = tree.find((node) => node.id === activeMissionId) ?? tree[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="rounded-full border-white/15 bg-white/5 px-4 text-white hover:bg-white/10"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            Return to deck
          </Button>

          <div className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-200">
            {selectedPath.name} skill tree online
          </div>
        </div>

        <Card className="rounded-[32px] border border-white/10 bg-slate-950/60 p-0">
          <CardContent className="p-4 sm:p-5">
            <SkillTreeCanvas
              activeMissionId={activeMissionId}
              onSelectMission={onSelectMission}
              tree={tree}
              xpByNode={xpByNode}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <ActiveMissionPanel
          activeMission={activeMission}
          elapsedSeconds={elapsedSeconds}
          selectedActivityType={selectedActivityType}
          setSelectedActivityType={setSelectedActivityType}
          timerRunning={timerRunning}
          xpByNode={xpByNode}
        />

        <Card className="rounded-[28px] border border-white/10 bg-slate-950/70 p-0">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
                  Session Link
                </p>
                <h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                  Timer bound to mission
                </h3>
              </div>
              <div className="font-mono text-sm uppercase tracking-[0.25em] text-slate-300">
                {formatDuration(elapsedSeconds)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-full bg-cyan-300 px-4 text-slate-950 hover:bg-cyan-200"
                onClick={onToggleTimer}
              >
                {timerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                {timerRunning ? "Pause timer" : "Start timer"}
              </Button>

              <Button
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={onCommitTimerSession}
                disabled={elapsedSeconds === 0}
              >
                <Sparkles className="size-4" />
                Progress registered
              </Button>

              <Button
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={onResetTimer}
                disabled={elapsedSeconds === 0 && !timerRunning}
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
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
                    {activity.description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(34,8,52,0.62),rgba(10,12,24,0.82))] p-0">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-fuchsia-200/70">
                Mission Detail
              </p>
              <h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                {activeMission.name}
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {activeMission.description}
              </p>
            </div>

            <div className="space-y-2 rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                <span>State</span>
                <span>{getNodeState(activeMission, xpByNode).replaceAll("_", " ")}</span>
              </div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                <span>Visible progress</span>
                <span>{getVisibleProgressLabel(activeMission, xpByNode)}</span>
              </div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                <span>Branch</span>
                <span>{activeMission.branch}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[10, 20, 40].map((minutes) => (
                <Button
                  key={minutes}
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => onQuickLog(minutes, selectedActivityType)}
                >
                  Quick log {minutes}m
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border border-white/10 bg-slate-950/70 p-0">
          <CardContent className="space-y-3 p-5">
            <div className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
              Recent Sessions
            </div>

            {sessionFeed.length === 0 ? (
              <p className="text-sm text-slate-400">
                No transmissions yet. Start the timer or quick-log a session to
                energize the tree.
              </p>
            ) : (
              sessionFeed.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>{session.activityLabel}</span>
                    <span>{session.minutes}m</span>
                  </div>
                  <div className="mt-2 text-sm text-white">{session.nodeName}</div>
                  <div className="mt-1 text-xs text-cyan-300">
                    {session.feedback}
                  </div>
                </motion.div>
              ))
            )}

            {latestSession && (
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Latest update committed to {latestSession.nodeName}.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
