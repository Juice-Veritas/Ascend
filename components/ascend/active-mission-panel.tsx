"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ACTIVITY_TYPES, type ActivityTypeId, type SkillNode } from "@/lib/ascend-data";
import {
  formatDuration,
  getNodeCharge,
  getVisibleProgressLabel,
} from "@/lib/ascend-engine";
import { cn } from "@/lib/utils";

type ActiveMissionPanelProps = {
  activeMission: SkillNode;
  elapsedSeconds: number;
  selectedActivityType: ActivityTypeId;
  setSelectedActivityType: (activityTypeId: ActivityTypeId) => void;
  timerRunning: boolean;
  xpByNode: Record<string, number>;
};

export function ActiveMissionPanel({
  activeMission,
  elapsedSeconds,
  selectedActivityType,
  setSelectedActivityType,
  timerRunning,
  xpByNode,
}: ActiveMissionPanelProps) {
  const charge = getNodeCharge(activeMission, xpByNode);

  return (
    <Card className="rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(9,15,28,0.95),rgba(5,8,16,0.9))] p-0 shadow-[0_0_60px_rgba(37,244,238,0.08)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
              Active Training
            </p>
            <h2 className="mt-2 font-heading text-3xl uppercase tracking-[0.12em] text-white">
              {activeMission.name}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{activeMission.description}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">
              Timer
            </div>
            <div className="mt-2 font-heading text-3xl uppercase tracking-[0.12em] text-white">
              {formatDuration(elapsedSeconds)}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
            <span>Visible progress</span>
            <span>{getVisibleProgressLabel(activeMission, xpByNode)}</span>
          </div>
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 flex-1 rounded-full bg-white/10",
                  index < Math.max(1, Math.ceil(charge * 5)) &&
                    "bg-[linear-gradient(90deg,rgba(37,244,238,0.95),rgba(254,52,187,0.8))]"
                )}
              />
            ))}
          </div>
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
              <div className="text-xs uppercase tracking-[0.2em]">{activity.label}</div>
              <div className="mt-1 text-[11px] text-slate-400">
                {activity.multiplier.toFixed(2)}x hidden XP
              </div>
            </button>
          ))}
        </div>

        <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
          {timerRunning
            ? "Transmission live. Session time is now bound to this mission."
            : "Timer offline. Select start when you are ready to train this node."}
        </div>
      </CardContent>
    </Card>
  );
}
