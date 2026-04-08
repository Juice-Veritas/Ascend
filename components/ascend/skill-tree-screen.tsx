"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

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
  onAddNode: (values: {
    name: string;
    branch: string;
    description: string;
    parentId: string;
    kind: SkillNode["kind"];
  }) => void;
  onBack: () => void;
  onCommitTimerSession: (note?: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onQuickLog: (minutes: number, activityTypeId: ActivityTypeId, note?: string) => void;
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
  onAddNode,
  onBack,
  onCommitTimerSession,
  onDeleteNode,
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
  const capstones = tree.filter((node) => node.kind === "capstone");
  const branchLabels = Array.from(new Set(tree.filter((node) => node.kind !== "capstone").map((node) => node.branch)));
  const [sessionNote, setSessionNote] = useState("");

  function handleQuickLog(minutes: number) {
    onQuickLog(minutes, selectedActivityType, sessionNote || undefined);
    setSessionNote("");
  }

  function handleCommitTimerSession() {
    onCommitTimerSession(sessionNote || undefined);
    setSessionNote("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.45fr_0.85fr]">
      <div className="space-y-4">
        <Card className="rounded-[30px] border border-white/10 bg-slate-950/78 p-0">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
                Tree Controls
              </p>
              <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                Shape the path manually
              </h2>
            </div>
            <AddNodeForm tree={tree} onAddNode={onAddNode} />
            <Button
              variant="outline"
              className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => activeMission && onDeleteNode(activeMission.id)}
              disabled={!activeMission}
            >
              <Trash2 className="size-4" />
              Delete selected node
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border border-white/10 bg-slate-950/78 p-0">
          <CardContent className="space-y-4 p-5">
            <div className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
              Capstones
            </div>
            {capstones.length > 0 ? (
              capstones.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onSelectMission(node.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-white hover:bg-white/10"
                >
                  <span>{node.name}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                    {getVisibleProgressLabel(node, tree, xpByNode)}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No capstones yet. Add one to anchor this tree around an end goal.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
            {selectedPath.name} progression map
          </div>
        </div>

        <Card className="rounded-[32px] border border-white/10 bg-slate-950/60 p-0">
          <CardContent className="space-y-5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">
                  Progression Flow
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  Foundations rise into branch work, and branch work converges into capstones.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {branchLabels.map((branch) => (
                  <span
                    key={branch}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {capstones.map((capstone) => (
                <motion.button
                  key={capstone.id}
                  type="button"
                  whileHover={{ y: -4 }}
                  onClick={() => onSelectMission(capstone.id)}
                  className="rounded-[24px] border border-fuchsia-300/25 bg-fuchsia-400/8 px-4 py-4 text-left"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fuchsia-200/80">
                    Capstone
                  </div>
                  <div className="mt-2 font-heading text-lg uppercase tracking-[0.08em] text-white">
                    {capstone.name}
                  </div>
                </motion.button>
              ))}
            </div>

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
        {activeMission ? (
          <ActiveMissionPanel
            activeMission={activeMission}
            elapsedSeconds={elapsedSeconds}
            selectedActivityType={selectedActivityType}
            setSelectedActivityType={setSelectedActivityType}
            timerRunning={timerRunning}
            tree={tree}
            xpByNode={xpByNode}
          />
        ) : null}

        <Card className="rounded-[28px] border border-white/10 bg-slate-950/70 p-0">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
                  XP Log
                </p>
                <h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                  Log effort
                </h3>
              </div>
              <div className="font-mono text-sm uppercase tracking-[0.25em] text-slate-300">
                {formatDuration(elapsedSeconds)}
              </div>
            </div>

            <textarea
              value={sessionNote}
              onChange={(event) => setSessionNote(event.target.value)}
              rows={4}
              placeholder="Document what you worked on, what felt hard, or what changed."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />

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
                onClick={handleCommitTimerSession}
                disabled={elapsedSeconds === 0}
              >
                <Sparkles className="size-4" />
                Log timed session
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={onResetTimer}
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
                  <div className="text-xs uppercase tracking-[0.2em]">{activity.label}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{activity.description}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {[10, 20, 40].map((minutes) => (
                <Button
                  key={minutes}
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => handleQuickLog(minutes)}
                >
                  Quick log {minutes}m
                </Button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Hidden XP is still being tracked under the hood from time and intensity. This interface only shows the visible signal.
            </p>
          </CardContent>
        </Card>

        {activeMission ? (
          <Card className="rounded-[28px] border border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(34,8,52,0.62),rgba(10,12,24,0.82))] p-0">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.34em] text-fuchsia-200/70">
                  Mission Detail
                </p>
                <h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                  {activeMission.name}
                </h3>
                <p className="mt-2 text-sm text-slate-300">{activeMission.description}</p>
              </div>

              <div className="space-y-2 rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                  <span>State</span>
                  <span>{getNodeState(activeMission, tree, xpByNode).replaceAll("_", " ")}</span>
                </div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                  <span>Visible progress</span>
                  <span>{getVisibleProgressLabel(activeMission, tree, xpByNode)}</span>
                </div>
              </div>

              <div>
                <div className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300/70">
                  Suggested Work
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {activeMission.suggestions.map((suggestion) => (
                    <li key={suggestion} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-[28px] border border-white/10 bg-slate-950/70 p-0">
          <CardContent className="space-y-3 p-5">
            <div className="font-mono text-xs uppercase tracking-[0.34em] text-cyan-300/70">
              Recent Sessions
            </div>
            {sessionFeed.length === 0 ? (
              <p className="text-sm text-slate-400">
                No transmissions yet. Start the timer or quick-log a session to energize the tree.
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
                  {session.note ? <div className="mt-1 text-xs text-slate-300">{session.note}</div> : null}
                  <div className="mt-1 text-xs text-cyan-300">{session.feedback}</div>
                </motion.div>
              ))
            )}
            {latestSession ? (
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Latest update committed to {latestSession.nodeName}.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddNodeForm({
  onAddNode,
  tree,
}: {
  onAddNode: (values: {
    name: string;
    branch: string;
    description: string;
    parentId: string;
    kind: SkillNode["kind"];
  }) => void;
  tree: SkillNode[];
}) {
  return (
    <form
      className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = String(formData.get("name") ?? "").trim();

        if (!name) {
          return;
        }

        onAddNode({
          name,
          branch: String(formData.get("branch") ?? "Custom Branch").trim() || "Custom Branch",
          description:
            String(formData.get("description") ?? "").trim() ||
            "Custom node added to this progression map.",
          parentId: String(formData.get("parentId") ?? ""),
          kind: (String(formData.get("kind") ?? "skill") as SkillNode["kind"]),
        });

        event.currentTarget.reset();
      }}
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">
        Add node
      </div>
      <input
        name="name"
        placeholder="Node name"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
      />
      <input
        name="branch"
        placeholder="Branch label"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
      />
      <textarea
        name="description"
        rows={3}
        placeholder="What is this node and why does it matter?"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
      />
      <select
        name="parentId"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none"
        defaultValue=""
      >
        <option value="">No prerequisite</option>
        {tree.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </select>
      <select
        name="kind"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none"
        defaultValue="skill"
      >
        <option value="skill">Skill node</option>
        <option value="capstone">Capstone</option>
        <option value="foundation">Foundation</option>
      </select>
      <Button className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">
        <Plus className="size-4" />
        Add node
      </Button>
    </form>
  );
}
