"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

import { type SkillNode } from "@/lib/ascend-data";
import { normalizeNodePosition } from "@/lib/ascend-layout";
import {
  getMilestoneProgress,
  getNodeCharge,
  getNodeState,
} from "@/lib/ascend-engine";
import { cn } from "@/lib/utils";

type SkillTreeCanvasProps = {
  activeNodeId: string;
  connectionSourceId?: string | null;
  connectionMode?: boolean;
  editMode: boolean;
  onConnectNode?: (nodeId: string) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onSelectNode: (nodeId: string) => void;
  tree: SkillNode[];
};

export function SkillTreeCanvas({
  activeNodeId,
  connectionSourceId,
  connectionMode = false,
  editMode,
  onConnectNode,
  onMoveNode,
  onSelectNode,
  tree,
}: SkillTreeCanvasProps) {
  const branches = Array.from(
    new Set(tree.filter((node) => node.nodeType !== "capstone").map((node) => node.branch))
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (tree.length === 0) {
    return (
      <div className="flex min-h-[640px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-[radial-gradient(circle_at_top,rgba(37,244,238,0.08),transparent_30%),linear-gradient(180deg,rgba(11,15,28,0.96),rgba(5,6,14,0.96))] px-6 text-center text-slate-400">
        Add a path node in edit mode to begin shaping this mastery map.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-[640px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(37,244,238,0.08),transparent_30%),linear-gradient(180deg,rgba(11,15,28,0.96),rgba(5,6,14,0.96))]"
    >
      {editMode ? (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(37,244,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(37,244,238,0.06)_1px,transparent_1px)] bg-[size:8%_8%] opacity-50" />
      ) : null}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {tree.flatMap((node) =>
          node.prerequisites.map((prerequisiteId) => {
            const prerequisite = tree.find((item) => item.id === prerequisiteId);

            if (!prerequisite) {
              return [];
            }

            const prerequisiteState = getNodeState(prerequisite, tree);
            const unlocked = prerequisiteState === "mastered";

            return (
              <line
                key={`${prerequisite.id}-${node.id}`}
                x1={prerequisite.position.x}
                y1={prerequisite.position.y}
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
        const state = getNodeState(node, tree);
        const charge = getNodeCharge(node);
        const isActive = node.id === activeNodeId;
        const isConnectionSource = node.id === connectionSourceId;
        const milestoneProgress = getMilestoneProgress(node);

        return (
          <motion.button
            key={node.id}
            type="button"
            className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
            style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
            whileHover={{ scale: 1.04 }}
            whileDrag={editMode ? { scale: 1.04, zIndex: 20 } : undefined}
            drag={editMode}
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={(_event, info) => {
              if (!editMode) {
                return;
              }

              const bounds = containerRef.current?.getBoundingClientRect();

              if (!bounds) {
                return;
              }

              const relativeX = ((info.point.x - bounds.left) / bounds.width) * 100;
              const relativeY = ((info.point.y - bounds.top) / bounds.height) * 100;
              const nextPosition = normalizeNodePosition(
                {
                  x: relativeX,
                  y: relativeY,
                },
                node.nodeType
              );

              onMoveNode(node.id, nextPosition);
            }}
            onClick={() => {
              if (connectionMode && onConnectNode) {
                onConnectNode(node.id);
                return;
              }
              onSelectNode(node.id);
            }}
          >
            <motion.div
              animate={
                isActive
                  ? {
                      boxShadow: [
                        "0 0 18px rgba(37,244,238,0.35)",
                        "0 0 38px rgba(254,52,187,0.24)",
                        "0 0 18px rgba(37,244,238,0.35)",
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "flex min-w-[146px] max-w-[168px] flex-col gap-2 border px-4 py-3 backdrop-blur transition-colors",
                node.nodeType === "capstone"
                  ? "rounded-[22px] [clip-path:polygon(12%_0,88%_0,100%_50%,88%_100%,12%_100%,0_50%)]"
                  : "rounded-[24px]",
                state === "locked" &&
                  "border-slate-700/80 bg-slate-950/75 text-slate-500 shadow-[0_0_0_rgba(0,0,0,0)]",
                state === "available" &&
                  "border-sky-200/20 bg-slate-900/80 text-slate-100 shadow-[0_0_22px_rgba(148,163,184,0.06)]",
                state === "in-progress" &&
                  "border-cyan-300/55 bg-cyan-400/10 text-white shadow-[0_0_26px_rgba(37,244,238,0.16)]",
                state === "mastered" &&
                  "border-fuchsia-300/55 bg-fuchsia-400/12 text-white shadow-[0_0_28px_rgba(254,52,187,0.22)]",
                isActive && "ring-1 ring-cyan-200/60",
                isConnectionSource && "ring-2 ring-fuchsia-300/70",
                node.nodeType === "capstone" && "border-fuchsia-300/35"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">
                  {node.branch}
                </div>
                <div
                  className={cn(
                    "size-3 rounded-full ring-2 ring-black/20",
                    state === "locked" && "bg-slate-600",
                    state === "available" && "bg-sky-200",
                    state === "in-progress" && "bg-cyan-300 shadow-[0_0_12px_rgba(37,244,238,0.65)]",
                    state === "mastered" && "bg-fuchsia-300 shadow-[0_0_12px_rgba(254,52,187,0.7)]"
                  )}
                />
              </div>

              <div className="font-heading text-base uppercase tracking-[0.08em]">
                {node.title}
              </div>

              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-full bg-white/10",
                      index < Math.max(1, Math.ceil(charge * 4)) &&
                        (state === "mastered" ? "bg-fuchsia-300" : state === "available" ? "bg-sky-200" : "bg-cyan-300")
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-400">
                <span>{node.nodeType}</span>
                <span>
                  {milestoneProgress.completedCount}/{milestoneProgress.totalCount || 0}
                </span>
              </div>
            </motion.div>
          </motion.button>
        );
      })}

      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap justify-center gap-2">
        <div className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-cyan-200/75">
          {connectionMode ? "Connect: choose source, then target" : editMode ? "Drag nodes to tune the layout" : "Select a node to inspect mastery"}
        </div>
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
