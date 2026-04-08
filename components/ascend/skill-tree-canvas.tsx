"use client";

import { motion } from "framer-motion";

import { type SkillNode } from "@/lib/ascend-data";
import { getNodeCharge, getNodeState } from "@/lib/ascend-engine";
import { cn } from "@/lib/utils";

type SkillTreeCanvasProps = {
  activeMissionId: string;
  onSelectMission: (nodeId: string) => void;
  tree: SkillNode[];
  xpByNode: Record<string, number>;
};

export function SkillTreeCanvas({
  activeMissionId,
  onSelectMission,
  tree,
  xpByNode,
}: SkillTreeCanvasProps) {
  const branches = Array.from(new Set(tree.filter((node) => node.kind !== "capstone").map((node) => node.branch)));

  if (tree.length === 0) {
    return (
      <div className="flex min-h-[640px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-[radial-gradient(circle_at_top,rgba(37,244,238,0.08),transparent_30%),linear-gradient(180deg,rgba(11,15,28,0.96),rgba(5,6,14,0.96))] px-6 text-center text-slate-400">
        Add a capstone or supporting node to begin shaping this progression map.
      </div>
    );
  }

  return (
    <div className="relative min-h-[640px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(37,244,238,0.08),transparent_30%),linear-gradient(180deg,rgba(11,15,28,0.96),rgba(5,6,14,0.96))]">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {tree.flatMap((node) =>
          node.requirements.map((requirementId) => {
            const requirement = tree.find((item) => item.id === requirementId);

            if (!requirement) {
              return [];
            }

            const requirementState = getNodeState(requirement, tree, xpByNode);
            const unlocked = requirementState === "COMPLETED";

            return (
              <line
                key={`${requirement.id}-${node.id}`}
                x1={requirement.position.x}
                y1={requirement.position.y}
                x2={node.position.x}
                y2={node.position.y}
                stroke={unlocked ? "rgba(37,244,238,0.65)" : "rgba(148,163,184,0.25)"}
                strokeWidth="0.35"
                strokeDasharray={unlocked ? "0" : "1.5 1.5"}
              />
            );
          })
        )}
      </svg>

      {tree.map((node) => {
        const state = getNodeState(node, tree, xpByNode);
        const charge = getNodeCharge(node, xpByNode);
        const isActive = node.id === activeMissionId;

        return (
          <motion.button
            key={node.id}
            type="button"
            className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
            style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
            whileHover={{ scale: 1.04 }}
            onClick={() => onSelectMission(node.id)}
          >
            <motion.div
              animate={
                isActive
                  ? {
                      boxShadow: [
                        "0 0 18px rgba(37,244,238,0.25)",
                        "0 0 36px rgba(254,52,187,0.28)",
                        "0 0 18px rgba(37,244,238,0.25)",
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "flex min-w-[132px] max-w-[154px] flex-col gap-2 rounded-[24px] border px-4 py-3 backdrop-blur",
                state === "LOCKED" &&
                  "border-slate-700/70 bg-slate-900/75 text-slate-500",
                state === "AVAILABLE" &&
                  "border-white/15 bg-slate-900/80 text-slate-200",
                state === "IN_PROGRESS" &&
                  "border-cyan-300/45 bg-cyan-400/8 text-white",
                state === "COMPLETED" &&
                  "border-fuchsia-300/45 bg-fuchsia-400/10 text-white",
                isActive && "ring-1 ring-cyan-200/50",
                node.kind === "capstone" && "min-w-[148px] border-fuchsia-300/35"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">
                  {node.branch}
                </div>
                <div
                  className={cn(
                    "size-2 rounded-full",
                    state === "LOCKED" && "bg-slate-600",
                    state === "AVAILABLE" && "bg-slate-300",
                    state === "IN_PROGRESS" && "bg-cyan-300",
                    state === "COMPLETED" && "bg-fuchsia-300"
                  )}
                />
              </div>

              <div className="font-heading text-base uppercase tracking-[0.08em]">
                {node.name}
              </div>

              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-full bg-white/10",
                      index < Math.max(1, Math.ceil(charge * 4)) &&
                        (state === "COMPLETED" ? "bg-fuchsia-300" : "bg-cyan-300")
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </motion.button>
        );
      })}

      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap justify-center gap-2">
        {branches.map((branch) => (
          <div
            key={branch}
            className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-400"
          >
            {branch}
          </div>
        ))}
      </div>
    </div>
  );
}
