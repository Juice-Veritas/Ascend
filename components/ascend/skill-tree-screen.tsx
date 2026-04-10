
"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Link2,
  Lock,
  Pause,
  PencilLine,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";

import { ActiveMissionPanel } from "@/components/ascend/active-mission-panel";
import { SkillTreeCanvas } from "@/components/ascend/skill-tree-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ACTIVITY_TYPES,
  type ActivityTypeId,
  type DemonstrationRequirement,
  type EvidenceFields,
  type Milestone,
  type PathDefinition,
  type SessionLog,
  type SkillNode,
} from "@/lib/ascend-data";
import {
  formatDuration,
  getMilestoneProgress,
  getNodeNextAction,
  getNodeNextActionContext,
  getNodeState,
  getVisibleProgressLabel,
  isMilestoneComplete,
  updateMilestoneCompletion,
  updateMilestoneValue,
} from "@/lib/ascend-engine";
import {
  milestoneGenerator,
  type MilestoneGenerationSuggestion,
} from "@/lib/ascend-milestone-generator";
import { cn } from "@/lib/utils";

type SkillTreeScreenProps = {
  activeMissionId: string;
  elapsedSeconds: number;
  onAddNode: (values: {
    title: string;
    branch: string;
    description: string;
    prerequisiteIds: string[];
    milestones?: Milestone[];
    nodeType: SkillNode["nodeType"];
    capstoneGoal?: string;
    intendedOutcome?: string;
    demonstrationBypassesMilestones?: boolean;
    demonstrationTitle?: string;
    demonstrationDescription?: string;
  }) => void;
  onBack: () => void;
  onCommitTimerSession: (note?: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onQuickLog: (minutes: number, activityTypeId: ActivityTypeId, note?: string) => void;
  onResetTimer: () => void;
  onSelectMission: (nodeId: string) => void;
  onTidyTree: () => void;
  onToggleTimer: () => void;
  onUpdateNode: (node: SkillNode) => void;
  selectedActivityType: ActivityTypeId;
  selectedPath: PathDefinition;
  sessionFeed: SessionLog[];
  setSelectedActivityType: (activityTypeId: ActivityTypeId) => void;
  timerRunning: boolean;
  tree: SkillNode[];
};

type CompletionFeedback = {
  id: string;
  title: string;
  body: string;
  tone: "cyan" | "fuchsia";
};

type EditDraft = {
  title: string;
  branch: string;
  description: string;
  nodeType: SkillNode["nodeType"];
  prerequisiteIds: string[];
  capstoneGoal: string;
  intendedOutcome: string;
  demonstrationTitle: string;
  demonstrationDescription: string;
  demonstrationBypassesMilestones: boolean;
};

const EMPTY_DRAFT: EditDraft = {
  title: "",
  branch: "",
  description: "",
  nodeType: "skill",
  prerequisiteIds: [],
  capstoneGoal: "",
  intendedOutcome: "",
  demonstrationTitle: "",
  demonstrationDescription: "",
  demonstrationBypassesMilestones: false,
};

export function SkillTreeScreen({
  activeMissionId,
  elapsedSeconds,
  onAddNode,
  onBack,
  onCommitTimerSession,
  onDeleteNode,
  onMoveNode,
  onQuickLog,
  onResetTimer,
  onSelectMission,
  onTidyTree,
  onToggleTimer,
  onUpdateNode,
  selectedActivityType,
  selectedPath,
  sessionFeed,
  setSelectedActivityType,
  timerRunning,
  tree,
}: SkillTreeScreenProps) {
  const activeMission = tree.find((node) => node.id === activeMissionId) ?? tree[0];
  const capstones = tree.filter((node) => node.nodeType === "capstone");
  const branchLabels = Array.from(
    new Set(tree.filter((node) => node.nodeType !== "capstone").map((node) => node.branch))
  );
  const nodeSessions = sessionFeed.filter((session) => session.nodeId === activeMission?.id);
  const progress = activeMission ? getMilestoneProgress(activeMission) : null;
  const activeState = activeMission ? getNodeState(activeMission, tree) : "locked";
  const [editMode, setEditMode] = useState(false);
  const [sessionNote, setSessionNote] = useState("");
  const [showSupportingLogs, setShowSupportingLogs] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>(EMPTY_DRAFT);
  const [aiSuggestion, setAiSuggestion] = useState<MilestoneGenerationSuggestion | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading">("idle");
  const [feedback, setFeedback] = useState<CompletionFeedback | null>(null);
  const [drawerReady, setDrawerReady] = useState(false);

  useEffect(() => {
    setDrawerReady(true);
  }, []);

  useEffect(() => {
    if (!editMode || !activeMission || editTargetId === null) {
      return;
    }

    setDraft({
      title: activeMission.title,
      branch: activeMission.branch,
      description: activeMission.description,
      nodeType: activeMission.nodeType,
      prerequisiteIds: activeMission.prerequisites,
      capstoneGoal: activeMission.capstoneGoal ?? "",
      intendedOutcome: activeMission.intendedOutcome ?? "",
      demonstrationTitle: activeMission.demonstration.title,
      demonstrationDescription: activeMission.demonstration.description,
      demonstrationBypassesMilestones: Boolean(activeMission.demonstrationBypassesMilestones),
    });
    setAiSuggestion(null);
  }, [activeMission, editMode, editTargetId]);

  useEffect(() => {
    if (!editMode) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editMode]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function beginCreateNode() {
    setEditTargetId(null);
    setDraft({ ...EMPTY_DRAFT, branch: activeMission?.branch ?? "" });
    setAiSuggestion(null);
    setEditMode(true);
  }

  function beginEditNode() {
    if (!activeMission) {
      return;
    }

    setEditTargetId(activeMission.id);
    setDraft({
      title: activeMission.title,
      branch: activeMission.branch,
      description: activeMission.description,
      nodeType: activeMission.nodeType,
      prerequisiteIds: activeMission.prerequisites,
      capstoneGoal: activeMission.capstoneGoal ?? "",
      intendedOutcome: activeMission.intendedOutcome ?? "",
      demonstrationTitle: activeMission.demonstration.title,
      demonstrationDescription: activeMission.demonstration.description,
      demonstrationBypassesMilestones: Boolean(activeMission.demonstrationBypassesMilestones),
    });
    setAiSuggestion(null);
    setEditMode(true);
  }

  function triggerFeedback(previousNode: SkillNode, nextNode: SkillNode) {
    const completedMilestone = nextNode.milestones.find((milestone) => {
      const before = previousNode.milestones.find((item) => item.id === milestone.id);
      return before && !isMilestoneComplete(before) && isMilestoneComplete(milestone);
    });

    if (completedMilestone) {
      setFeedback({
        id: `${completedMilestone.id}-${Date.now()}`,
        title: "Milestone completed",
        body: completedMilestone.title,
        tone: "cyan",
      });
      return;
    }

    if (!previousNode.demonstration.completed && nextNode.demonstration.completed) {
      setFeedback({
        id: `demo-${nextNode.id}-${Date.now()}`,
        title: "Demonstration recorded",
        body: nextNode.demonstration.title,
        tone: "fuchsia",
      });
      return;
    }

    const nextTree = tree.map((node) => (node.id === nextNode.id ? nextNode : node));
    if (
      getNodeState(previousNode, tree) !== "mastered" &&
      getNodeState(nextNode, nextTree) === "mastered"
    ) {
      setFeedback({
        id: `mastered-${nextNode.id}-${Date.now()}`,
        title: "Node mastered",
        body: `${nextNode.title} is now locked in.`,
        tone: "fuchsia",
      });
    }
  }

  function updateActiveNode(transform: (node: SkillNode) => SkillNode) {
    if (!activeMission) {
      return;
    }

    const nextNode = transform(activeMission);
    triggerFeedback(activeMission, nextNode);
    onUpdateNode(nextNode);
  }

  function updateMilestone(milestoneId: string, transform: (milestone: Milestone) => Milestone) {
    updateActiveNode((node) => ({
      ...node,
      milestones: node.milestones.map((milestone) =>
        milestone.id === milestoneId ? transform(milestone) : milestone
      ),
    }));
  }

  function updateMilestoneEvidence(milestoneId: string, evidence: EvidenceFields) {
    updateMilestone(milestoneId, (milestone) => ({ ...milestone, evidence }));
  }

  function updateDemonstration(transform: (demo: DemonstrationRequirement) => DemonstrationRequirement) {
    updateActiveNode((node) => ({
      ...node,
      demonstration: transform(node.demonstration),
    }));
  }

  function handleQuickLog(minutes: number) {
    onQuickLog(minutes, selectedActivityType, sessionNote || undefined);
    setSessionNote("");
  }

  function handleCommitTimerSession() {
    onCommitTimerSession(sessionNote || undefined);
    setSessionNote("");
  }

  async function handleGenerateMilestones() {
    setAiStatus("loading");
    const suggestion = await milestoneGenerator.suggest({
      nodeTitle: draft.title || activeMission?.title || "Untitled node",
      nodeDescription: draft.description || activeMission?.description || "",
      parentBranch: draft.branch || activeMission?.branch || "Custom Branch",
      nodeType: draft.nodeType,
      capstoneGoal: draft.capstoneGoal || undefined,
      intendedOutcome: draft.intendedOutcome || undefined,
    });
    setAiSuggestion(suggestion);
    setDraft((current) => ({
      ...current,
      demonstrationTitle: suggestion.demonstrationTitle,
      demonstrationDescription: suggestion.demonstrationDescription,
    }));
    setAiStatus("idle");
  }

  function applyAiSuggestion() {
    if (!activeMission || !aiSuggestion) {
      return;
    }

    onUpdateNode({
      ...activeMission,
      milestones: aiSuggestion.milestones,
      demonstration: {
        ...activeMission.demonstration,
        title: aiSuggestion.demonstrationTitle,
        description: aiSuggestion.demonstrationDescription,
      },
    });
    setAiSuggestion(null);
  }

  function saveEditDraft() {
    if (!draft.title.trim()) {
      return;
    }

    if (!editTargetId) {
      onAddNode({
        title: draft.title.trim(),
        branch: draft.branch.trim() || "Custom Branch",
        description: draft.description.trim() || "A custom mastery node.",
        prerequisiteIds: draft.prerequisiteIds,
        milestones: aiSuggestion?.milestones,
        nodeType: draft.nodeType,
        capstoneGoal: draft.capstoneGoal.trim() || undefined,
        intendedOutcome: draft.intendedOutcome.trim() || undefined,
        demonstrationBypassesMilestones: draft.demonstrationBypassesMilestones,
        demonstrationTitle: draft.demonstrationTitle.trim() || undefined,
        demonstrationDescription: draft.demonstrationDescription.trim() || undefined,
      });
    } else if (activeMission) {
      onUpdateNode({
        ...activeMission,
        title: draft.title.trim(),
        branch: draft.branch.trim() || "Custom Branch",
        description: draft.description.trim() || "A custom mastery node.",
        nodeType: draft.nodeType,
        prerequisites: draft.prerequisiteIds,
        capstoneGoal: draft.capstoneGoal.trim() || undefined,
        intendedOutcome: draft.intendedOutcome.trim() || undefined,
        demonstrationBypassesMilestones: draft.demonstrationBypassesMilestones,
        demonstration: {
          ...activeMission.demonstration,
          title: draft.demonstrationTitle.trim() || activeMission.demonstration.title,
          description:
            draft.demonstrationDescription.trim() || activeMission.demonstration.description,
        },
      });
    }

    setEditMode(false);
  }

  return (
    <div className="relative space-y-6">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }} className="grid gap-4 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,20,0.96),rgba(5,7,16,0.92))] p-5 shadow-[0_0_60px_rgba(25,211,255,0.05)] lg:grid-cols-[auto_1fr_auto]">
        <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Paths
        </Button>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-200/80">{selectedPath.kicker}</span>
            <Tag>{selectedPath.name}</Tag>
            {activeMission ? <Tag>Current mission: {activeMission.title}</Tag> : null}
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <h2 className="font-heading text-3xl uppercase tracking-[0.12em] text-white sm:text-4xl">Calm map, clear next move.</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">Enter a focused session, finish real milestones, and use proof to keep the tree honest.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">Next</div>
              <div className="mt-2 text-sm text-white">{activeMission ? getNodeNextAction(activeMission, tree) : "Select a node."}</div>
              <div className="mt-2 text-xs text-slate-400">{activeMission ? getNodeNextActionContext(activeMission, tree) : "The selected node will always surface one concrete move."}</div>
            </div>
          </div>
        </div>
        <div className="flex items-start justify-end gap-2">
          <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onTidyTree}><WandSparkles className="size-4" />Tidy map</Button>
          <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={beginCreateNode}><Plus className="size-4" />New node</Button>
          <Button className={cn("rounded-full px-4", editMode ? "bg-fuchsia-300 text-slate-950 hover:bg-fuchsia-200" : "bg-cyan-300 text-slate-950 hover:bg-cyan-200")} onClick={() => (editMode ? setEditMode(false) : beginEditNode())}><PencilLine className="size-4" />{editMode ? "Exit edit mode" : "Edit mode"}</Button>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,26,0.96),rgba(5,8,18,0.95))] p-0">
          <CardContent className="space-y-5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">Progression map</div>
                <div className="mt-1 text-sm text-slate-300">Foundations support branch work, branch work feeds capstones.</div>
              </div>
              <div className="flex flex-wrap gap-2">{branchLabels.map((branch) => <Tag key={branch}>{branch}</Tag>)}</div>
            </div>
            {capstones.length > 0 ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{capstones.map((capstone) => <button key={capstone.id} type="button" onClick={() => onSelectMission(capstone.id)} className={cn("rounded-[24px] border px-4 py-4 text-left transition-colors", capstone.id === activeMission?.id ? "border-fuchsia-300/35 bg-fuchsia-400/12" : "border-white/10 bg-white/5 hover:border-fuchsia-300/20 hover:bg-white/8")}><div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fuchsia-200/80">Capstone</div><div className="mt-2 font-heading text-lg uppercase tracking-[0.08em] text-white">{capstone.title}</div><div className="mt-2 text-xs text-slate-300">{getVisibleProgressLabel(capstone, tree)}</div></button>)}</div> : null}
            <SkillTreeCanvas activeNodeId={activeMission?.id ?? ""} editMode={editMode} onMoveNode={onMoveNode} onSelectNode={onSelectMission} tree={tree} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          {activeMission ? (
            <>
              <ActiveMissionPanel node={activeMission} pathName={selectedPath.name} tree={tree} />
              <SectionCard label="Selected node" title={activeMission.title} tone="cyan">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatePill state={activeState} />
                    <Tag>{activeMission.nodeType}</Tag>
                    <Tag>{activeMission.branch}</Tag>
                  </div>
                  <p className="text-sm text-slate-300">{activeMission.description}</p>
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400"><span>Milestone progress</span><span>{progress?.completedCount ?? 0}/{progress?.totalCount ?? 0}</span></div>
                    <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(25,211,255,0.96),rgba(240,79,255,0.82))]" style={{ width: `${Math.max(6, Math.round((progress?.ratio ?? 0) * 100))}%` }} /></div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400"><span>{getVisibleProgressLabel(activeMission, tree)}</span><span>{getNodeNextAction(activeMission, tree)}</span></div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard label="Milestones" title="Mastery path">
                <div className="space-y-3">
                  {activeMission.milestones.map((milestone) => (
                    <MilestoneRow
                      key={milestone.id}
                      milestone={milestone}
                      onDecrement={() => updateMilestone(milestone.id, (current) => current.progressType === "numeric" ? updateMilestoneValue(current, Math.max(0, (current.currentValue ?? 0) - 1)) : updateMilestoneCompletion(current, !isMilestoneComplete(current)))}
                      onIncrement={() => updateMilestone(milestone.id, (current) => current.progressType === "numeric" ? updateMilestoneValue(current, Math.min(current.targetValue ?? Number.MAX_SAFE_INTEGER, (current.currentValue ?? 0) + 1)) : updateMilestoneCompletion(current, !isMilestoneComplete(current)))}
                      onIncrementByTwo={() => updateMilestone(milestone.id, (current) => current.progressType === "numeric" ? updateMilestoneValue(current, Math.min(current.targetValue ?? Number.MAX_SAFE_INTEGER, (current.currentValue ?? 0) + 2)) : updateMilestoneCompletion(current, !isMilestoneComplete(current)))}
                      onSetValue={(value) => updateMilestone(milestone.id, (current) => current.progressType === "numeric" ? updateMilestoneValue(current, Math.max(0, value)) : current)}
                      onToggle={() => updateMilestone(milestone.id, (current) => updateMilestoneCompletion(current, !isMilestoneComplete(current)))}
                      onEvidenceChange={(evidence) => updateMilestoneEvidence(milestone.id, evidence)}
                    />
                  ))}
                </div>
              </SectionCard>
              <SectionCard label="Final demonstration" title={activeMission.demonstration.title} tone="fuchsia">
                <div className="space-y-4">
                  <p className="text-sm text-slate-300">{activeMission.demonstration.description}</p>
                  {activeMission.demonstrationBypassesMilestones ? <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 px-3 py-3 text-xs text-cyan-100/85">This node can be mastered directly from a meaningful demonstration.</div> : null}
                  <Button className={cn("w-full rounded-full", activeMission.demonstration.completed ? "bg-fuchsia-300 text-slate-950 hover:bg-fuchsia-200" : "bg-cyan-300 text-slate-950 hover:bg-cyan-200")} onClick={() => updateDemonstration((demo) => ({ ...demo, completed: !demo.completed, completedAt: !demo.completed ? new Date().toISOString() : undefined }))}><Check className="size-4" />{activeMission.demonstration.completed ? "Demonstration complete" : "Mark demonstration complete"}</Button>
                  <EvidenceEditor evidence={activeMission.demonstration.evidence} onChange={(evidence) => updateDemonstration((demo) => ({ ...demo, evidence }))} />
                </div>
              </SectionCard>
              <SectionCard label="Supporting work" title={showSupportingLogs ? "Effort log open" : "Effort log hidden"}>
                <div className="space-y-4">
                  <button type="button" onClick={() => setShowSupportingLogs((current) => !current)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-white">
                    <span>Session history and optional time logs</span>
                    <ChevronRight className={cn("size-4 text-slate-400 transition-transform", showSupportingLogs && "rotate-90")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showSupportingLogs ? (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-4 pt-2">
                          <div className="font-mono text-sm uppercase tracking-[0.24em] text-slate-300">{formatDuration(elapsedSeconds)}</div>
                          <textarea value={sessionNote} onChange={(event) => setSessionNote(event.target.value)} rows={4} placeholder="Log optional notes, reflections, or what the session produced." className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
                          <div className="grid grid-cols-2 gap-2">{ACTIVITY_TYPES.map((activity) => <button key={activity.id} type="button" onClick={() => setSelectedActivityType(activity.id)} className={cn("rounded-2xl border px-3 py-3 text-left transition-colors", selectedActivityType === activity.id ? "border-cyan-300/60 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20")}><div className="text-xs uppercase tracking-[0.2em]">{activity.label}</div><div className="mt-1 text-[11px] text-slate-400">{activity.description}</div></button>)}</div>
                          <div className="flex flex-wrap gap-2">
                            <Button className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={onToggleTimer}>{timerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}{timerRunning ? "Pause timer" : "Start timer"}</Button>
                            <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={handleCommitTimerSession} disabled={elapsedSeconds === 0}><Sparkles className="size-4" />Log timed session</Button>
                            <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onResetTimer}><RotateCcw className="size-4" />Reset</Button>
                          </div>
                          <div className="flex flex-wrap gap-2">{[10, 20, 40].map((minutes) => <Button key={minutes} variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => handleQuickLog(minutes)}>Quick log {minutes}m</Button>)}</div>
                          <div className="space-y-3">{nodeSessions.length === 0 ? <p className="text-sm text-slate-400">No supporting sessions yet. Use logs to capture effort and evidence.</p> : nodeSessions.map((session) => <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400"><span>{session.activityLabel}</span><span>{session.minutes}m</span></div>{session.note ? <div className="mt-2 text-sm text-slate-200">{session.note}</div> : null}<div className="mt-2 text-xs text-cyan-300">{session.feedback}</div></div>)}</div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </SectionCard>
            </>
          ) : (
            <SectionCard label="Selected node" title="No node selected"><p className="text-sm text-slate-400">Pick a node in the map to inspect milestones, demonstrations, and next actions.</p></SectionCard>
          )}
        </div>
      </motion.section>
      <AnimatePresence>
        {feedback ? (
          <motion.div key={feedback.id} initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.28 }} className={cn("pointer-events-none fixed bottom-6 right-6 z-40 max-w-sm rounded-[28px] border px-5 py-4 backdrop-blur", feedback.tone === "cyan" ? "border-cyan-300/35 bg-[linear-gradient(180deg,rgba(8,18,30,0.96),rgba(5,10,18,0.92))] shadow-[0_0_45px_rgba(37,244,238,0.2)]" : "border-fuchsia-300/35 bg-[linear-gradient(180deg,rgba(22,10,30,0.96),rgba(10,8,18,0.94))] shadow-[0_0_45px_rgba(254,52,187,0.18)]")}><div className="font-mono text-[11px] uppercase tracking-[0.34em] text-white/80">{feedback.title}</div><div className="mt-2 text-base text-white">{feedback.body}</div></motion.div>
        ) : null}
      </AnimatePresence>
      {drawerReady && editMode ? createPortal(
        <AnimatePresence>
          <>
            <motion.div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditMode(false)} />
            <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="fixed right-0 top-0 z-[100] h-screen w-full max-w-[460px] overflow-y-auto border-l border-white/10 bg-[linear-gradient(180deg,rgba(7,10,22,0.985),rgba(5,8,18,0.97))] p-5 shadow-[-24px_0_60px_rgba(0,0,0,0.35)]">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div><div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">Edit mode</div><h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.1em] text-white">{editTargetId ? "Edit selected node" : "Create node"}</h3></div>
                  <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setEditMode(false)}><X className="size-4" />Close</Button>
                </div>
                <SectionCard label="Node setup" title="Core definition">
                  <div className="space-y-3">
                    <InputField label="Title" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} placeholder="Vertical Pull" />
                    <InputField label="Branch" value={draft.branch} onChange={(value) => setDraft((current) => ({ ...current, branch: value }))} placeholder="Calisthenics" />
                    <SelectField label="Node type" value={draft.nodeType} onChange={(value) => setDraft((current) => ({ ...current, nodeType: value as SkillNode["nodeType"] }))} options={[{ value: "foundation", label: "Foundation" }, { value: "skill", label: "Skill" }, { value: "capstone", label: "Capstone" }]} />
                    <TextAreaField label="Description" value={draft.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} placeholder="What this node represents and why it matters." />
                    <TextAreaField label="Capstone or broader goal" value={draft.capstoneGoal} onChange={(value) => setDraft((current) => ({ ...current, capstoneGoal: value }))} placeholder="AR contact-lens prototype" />
                    <TextAreaField label="Intended outcome" value={draft.intendedOutcome} onChange={(value) => setDraft((current) => ({ ...current, intendedOutcome: value }))} placeholder="Build a working sensor test rig" />
                  </div>
                </SectionCard>
                <SectionCard label="Prerequisites" title="Unlock logic"><div className="space-y-2">{tree.filter((node) => node.id !== editTargetId).map((node) => { const selected = draft.prerequisiteIds.includes(node.id); return <button key={node.id} type="button" onClick={() => setDraft((current) => ({ ...current, prerequisiteIds: selected ? current.prerequisiteIds.filter((id) => id !== node.id) : [...current.prerequisiteIds, node.id] }))} className={cn("flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-colors", selected ? "border-cyan-300/45 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20")}><span>{node.title}</span>{selected ? <Check className="size-4" /> : <Lock className="size-4 text-slate-500" />}</button>; })}</div></SectionCard>
                <SectionCard label="Demonstration" title="Final proof">
                  <div className="space-y-3">
                    <InputField label="Demonstration title" value={draft.demonstrationTitle} onChange={(value) => setDraft((current) => ({ ...current, demonstrationTitle: value }))} placeholder="Perform the node standard" />
                    <TextAreaField label="Demonstration description" value={draft.demonstrationDescription} onChange={(value) => setDraft((current) => ({ ...current, demonstrationDescription: value }))} placeholder="How the user should prove this node is real." />
                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200"><input type="checkbox" checked={draft.demonstrationBypassesMilestones} onChange={(event) => setDraft((current) => ({ ...current, demonstrationBypassesMilestones: event.target.checked }))} className="mt-1" /><span>Allow direct mastery from demonstration if the user already has the skill.</span></label>
                  </div>
                </SectionCard>
                <SectionCard label="AI scaffold" title="Milestone generation">
                  <div className="space-y-3">
                    <p className="text-sm text-slate-300">This is a modular placeholder for future AI milestone generation. It already supports prototype-oriented suggestions.</p>
                    <Button className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={handleGenerateMilestones} disabled={aiStatus === "loading"}><Bot className="size-4" />{aiStatus === "loading" ? "Generating..." : "Suggest milestones with AI"}</Button>
                    {aiSuggestion ? <div className="space-y-3 rounded-[24px] border border-cyan-400/20 bg-cyan-400/8 p-4"><div className="text-sm text-cyan-100/90">{aiSuggestion.rationale}</div><div className="space-y-2">{aiSuggestion.milestones.map((milestone) => <div key={milestone.id} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white"><div className="font-medium">{milestone.title}</div><div className="mt-1 text-xs text-slate-300">{milestone.description}</div></div>)}</div><Button variant="outline" className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={applyAiSuggestion} disabled={!activeMission}>Apply suggestions to selected node</Button></div> : null}
                  </div>
                </SectionCard>
                <div className="flex flex-wrap gap-2"><Button className="flex-1 rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={saveEditDraft}><Check className="size-4" />Save node</Button>{activeMission && editTargetId ? <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => { onDeleteNode(activeMission.id); setEditMode(false); }}><Trash2 className="size-4" />Delete</Button> : null}</div>
              </div>
            </motion.aside>
          </>
        </AnimatePresence>,
        document.body
      ) : null}
    </div>
  );
}

function SectionCard({ children, label, title, tone = "default" }: { children: ReactNode; label: string; title: string; tone?: "default" | "cyan" | "fuchsia" }) {
  return <Card className={cn("rounded-[28px] border p-0", tone === "cyan" ? "border-cyan-400/20 bg-[linear-gradient(180deg,rgba(9,15,28,0.95),rgba(5,8,16,0.9))]" : tone === "fuchsia" ? "border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(28,8,34,0.85),rgba(8,9,18,0.92))]" : "border-white/10 bg-slate-950/70")}><CardContent className="space-y-4 p-4"><div><div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">{label}</div><div className="mt-1 font-heading text-xl uppercase tracking-[0.1em] text-white">{title}</div></div>{children}</CardContent></Card>;
}

function Tag({ children }: { children: ReactNode }) { return <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">{children}</span>; }

function StatePill({ state }: { state: ReturnType<typeof getNodeState> }) { return <span className={cn("rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em]", state === "locked" && "border border-slate-700/60 bg-slate-900/70 text-slate-400", state === "available" && "border border-sky-200/25 bg-sky-300/10 text-sky-100", state === "in-progress" && "border border-cyan-300/35 bg-cyan-400/10 text-cyan-100", state === "mastered" && "border border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100")}>{state.replace("-", " ")}</span>; }

function MilestoneRow({ milestone, onDecrement, onIncrement, onIncrementByTwo, onSetValue, onToggle, onEvidenceChange }: { milestone: Milestone; onDecrement: () => void; onIncrement: () => void; onIncrementByTwo: () => void; onSetValue: (value: number) => void; onToggle: () => void; onEvidenceChange: (evidence: EvidenceFields) => void }) {
  const complete = isMilestoneComplete(milestone);
  const [showEvidence, setShowEvidence] = useState(false);
  return <div className={cn("rounded-[24px] border px-4 py-4", complete ? "border-cyan-300/35 bg-cyan-400/10" : "border-white/10 bg-white/5")}><div className="flex items-start justify-between gap-3"><div><div className="font-medium text-white">{milestone.title}</div><div className="mt-1 text-sm text-slate-300">{milestone.description}</div></div><Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onToggle}><Check className="size-4" />{complete ? "Done" : "Mark"}</Button></div>{milestone.progressType === "numeric" ? <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3"><div className="flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-[0.22em] text-slate-400">Progress</span><div className="flex items-center gap-2"><Button variant="outline" className="size-8 rounded-full border-white/15 bg-white/5 p-0 text-white hover:bg-white/10" onClick={onDecrement}>-</Button><input type="number" value={milestone.currentValue ?? 0} onChange={(event) => { const nextValue = Number(event.target.value); onSetValue(Number.isFinite(nextValue) ? nextValue : 0); }} className="w-16 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white outline-none" /><span className="text-sm text-slate-300">/ {milestone.targetValue ?? 0}</span><Button variant="outline" className="size-8 rounded-full border-white/15 bg-white/5 p-0 text-white hover:bg-white/10" onClick={onIncrement}>+1</Button><Button variant="outline" className="rounded-full border-white/15 bg-white/5 px-3 text-white hover:bg-white/10" onClick={onIncrementByTwo}>+2</Button></div></div></div> : <div className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">{milestone.progressType}</div>}<button type="button" className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-200/80" onClick={() => setShowEvidence((current) => !current)}><Link2 className="size-3.5" />{showEvidence ? "Hide evidence" : "Add evidence"}</button><AnimatePresence initial={false}>{showEvidence ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="pt-3"><EvidenceEditor evidence={milestone.evidence} onChange={onEvidenceChange} /></div></motion.div> : null}</AnimatePresence></div>;
}

function EvidenceEditor({ evidence, onChange }: { evidence?: EvidenceFields; onChange: (evidence: EvidenceFields) => void }) {
  const nextEvidence = evidence ?? {};
  return <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/20 p-4"><InputField label="Link" value={nextEvidence.link ?? ""} onChange={(value) => onChange({ ...nextEvidence, link: value })} placeholder="https://..." /><TextAreaField label="Note" value={nextEvidence.note ?? ""} onChange={(value) => onChange({ ...nextEvidence, note: value })} placeholder="What changed, what you observed, or what matters." /><TextAreaField label="Proof text" value={nextEvidence.proofText ?? ""} onChange={(value) => onChange({ ...nextEvidence, proofText: value })} placeholder="Short proof of what was demonstrated." /><div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-400">File/image attachments stay placeholder-level for now. Keep this lightweight and use notes, links, or proof text first.</div></div>;
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="block space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label>; }

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="block space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label>; }

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <label className="block space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
