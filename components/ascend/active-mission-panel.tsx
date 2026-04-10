import { Target, Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { type SkillNode } from "@/lib/ascend-data";
import {
  getMilestoneProgress,
  getNodeNextAction,
  getNodeNextActionContext,
  getNodeState,
} from "@/lib/ascend-engine";
import { cn } from "@/lib/utils";

type ActiveMissionPanelProps = {
  node: SkillNode;
  pathName: string;
  tree: SkillNode[];
};

export function ActiveMissionPanel({ node, pathName, tree }: ActiveMissionPanelProps) {
  const progress = getMilestoneProgress(node);
  const state = getNodeState(node, tree);

  return (
    <Card className="rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(8,14,28,0.96),rgba(6,9,18,0.92))] p-0 shadow-[0_0_45px_rgba(37,244,238,0.08)]">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/75">
              You are training
            </div>
            <div className="mt-1 font-heading text-2xl uppercase tracking-[0.1em] text-white">
              {pathName}
            </div>
          </div>
          <div
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]",
              state === "locked" && "border-slate-600/50 bg-slate-900/60 text-slate-400",
              state === "available" && "border-sky-200/20 bg-sky-300/10 text-sky-100",
              state === "in-progress" && "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
              state === "mastered" && "border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-100"
            )}
          >
            {state.replace("-", " ")}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-200/75">
            <Target className="size-3.5" />
            Current mission
          </div>
          <div className="mt-2 font-heading text-2xl uppercase tracking-[0.08em] text-white">
            {node.title}
          </div>
          <p className="mt-2 text-sm text-slate-300">{node.description}</p>
        </div>

        <div className="rounded-[24px] border border-fuchsia-300/15 bg-fuchsia-400/8 px-4 py-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-fuchsia-100/80">
            <Zap className="size-3.5" />
            Next best action
          </div>
          <div className="mt-2 text-base text-white">{getNodeNextAction(node, tree)}</div>
          <div className="mt-2 text-sm text-slate-300">{getNodeNextActionContext(node, tree)}</div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
            <span>Mission progress</span>
            <span>
              {progress.completedCount}/{progress.totalCount}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(37,244,238,0.95),rgba(254,52,187,0.82))]"
              style={{ width: `${Math.max(8, Math.round(progress.ratio * 100))}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
