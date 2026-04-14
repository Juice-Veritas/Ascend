"use client";

import { type ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, Link2, Pause, PencilLine, Play, Plus, RotateCcw, Sparkles, WandSparkles } from "lucide-react";

import { NodeEditorSheet } from "@/components/ascend/node-editor-sheet";
import { NodeImportSheet } from "@/components/ascend/node-import-sheet";
import { SkillTreeCanvas } from "@/components/ascend/skill-tree-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type ImportedNodeDraft } from "@/lib/ascend-import";
import { ACTIVITY_TYPES, type ActivityTypeId, type DemonstrationRequirement, type EvidenceFields, type Milestone, type PathDefinition, type SessionLog, type SkillNode } from "@/lib/ascend-data";
import { formatDuration, getMilestoneProgress, getNodeNextAction, getNodeNextActionContext, getNodeState, getVisibleProgressLabel, isMilestoneComplete, updateMilestoneCompletion, updateMilestoneValue } from "@/lib/ascend-engine";
import { cn } from "@/lib/utils";

type SkillTreeScreenProps = {
  activeMissionId: string;
  elapsedSeconds: number;
  onAddNode: (values: { title: string; branch: string; description: string; quests: string[]; prerequisiteIds: string[]; milestones?: Milestone[]; nodeType: SkillNode["nodeType"]; capstoneGoal?: string; intendedOutcome?: string; demonstrationBypassesMilestones?: boolean; demonstrationTitle?: string; demonstrationDescription?: string; }) => void;
  onBack: () => void;
  onCommitTimerSession: (note?: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onImportNodes: (payload: { nodes: ImportedNodeDraft[]; attachToNodeId?: string; tidyLayout: boolean }) => void;
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

export function SkillTreeScreenRefined({ activeMissionId, elapsedSeconds, onAddNode, onBack, onCommitTimerSession, onDeleteNode, onImportNodes, onMoveNode, onQuickLog, onResetTimer, onSelectMission, onTidyTree, onToggleTimer, onUpdateNode, selectedActivityType, selectedPath, sessionFeed, setSelectedActivityType, timerRunning, tree }: SkillTreeScreenProps) {
  const activeMission = tree.find((node) => node.id === activeMissionId) ?? tree[0];
  const nodeSessions = sessionFeed.filter((session) => session.nodeId === activeMission?.id);
  const progress = activeMission ? getMilestoneProgress(activeMission) : null;
  const activeState = activeMission ? getNodeState(activeMission, tree) : "locked";
  const [editorOpen, setEditorOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<SkillNode | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [mapEditMode, setMapEditMode] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState<"logs" | "details" | null>(null);
  const [sessionNote, setSessionNote] = useState("");

  function updateActiveNode(transform: (node: SkillNode) => SkillNode) {
    if (!activeMission) {
      return;
    }
    onUpdateNode(transform(activeMission));
  }

  function updateMilestone(milestoneId: string, transform: (milestone: Milestone) => Milestone) {
    updateActiveNode((node) => ({ ...node, milestones: node.milestones.map((milestone) => milestone.id === milestoneId ? transform(milestone) : milestone) }));
  }

  function updateDemonstration(transform: (demo: DemonstrationRequirement) => DemonstrationRequirement) {
    updateActiveNode((node) => ({ ...node, demonstration: transform(node.demonstration) }));
  }

  function handleConnectNode(nodeId: string) {
    if (!connectSourceId) {
      setConnectSourceId(nodeId);
      onSelectMission(nodeId);
      return;
    }

    if (connectSourceId === nodeId) {
      setConnectSourceId(null);
      return;
    }

    const target = tree.find((node) => node.id === nodeId);
    if (!target) {
      return;
    }

    onUpdateNode({
      ...target,
      prerequisites: Array.from(new Set([...target.prerequisites, connectSourceId])),
    });
    onSelectMission(nodeId);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,20,0.96),rgba(5,7,16,0.92))] px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onBack}><ArrowLeft className="size-4" />Deck</Button>
          <div className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/80">{selectedPath.name}</div>
          {activeMission ? <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">{activeMission.title}</div> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onTidyTree}><WandSparkles className="size-4" />Tidy</Button>
          <Button variant="outline" className={cn("rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10", mapEditMode && "border-cyan-300/45 bg-cyan-400/10")} onClick={() => setMapEditMode((current) => !current)}><PencilLine className="size-4" />{mapEditMode ? "Arrange on" : "Arrange"}</Button>
          <Button variant="outline" className={cn("rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10", connectSourceId && "border-fuchsia-300/45 bg-fuchsia-400/10")} onClick={() => setConnectSourceId((current) => current ? null : activeMission?.id ?? null)}><Link2 className="size-4" />{connectSourceId ? "Connecting" : "Connect"}</Button>
          <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setImportOpen(true)}><Sparkles className="size-4" />Import</Button>
          <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => { setEditingNode(null); setEditorOpen(true); }}><Plus className="size-4" />New</Button>
          <Button className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={() => { if (!activeMission) { return; } setEditingNode(activeMission); setEditorOpen(true); }} disabled={!activeMission}><PencilLine className="size-4" />Edit</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,26,0.96),rgba(5,8,18,0.95))] p-0">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">Map</div>
                <div className="mt-1 text-sm text-slate-300">{connectSourceId ? "Choose the node that should unlock next." : mapEditMode ? "Drag nodes, then tidy if needed." : "Click a node. The right panel tells you what to do next."}</div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{connectSourceId ? "Source locked" : mapEditMode ? "Arrange mode" : "Use mode"}</div>
            </div>
            <SkillTreeCanvas activeNodeId={activeMission?.id ?? ""} connectionMode={Boolean(connectSourceId)} connectionSourceId={connectSourceId} editMode={mapEditMode} onConnectNode={handleConnectNode} onMoveNode={onMoveNode} onSelectNode={onSelectMission} tree={tree} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {activeMission ? (
            <>
              <Card className="rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(9,15,28,0.95),rgba(5,8,16,0.9))] p-0">
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatePill state={activeState} />
                    <Tag>{activeMission.nodeType}</Tag>
                    <Tag>{activeMission.branch}</Tag>
                  </div>
                  <div>
                    <div className="font-heading text-2xl uppercase tracking-[0.08em] text-white">{activeMission.title}</div>
                    <div className="mt-2 text-sm text-slate-300">{activeMission.description}</div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/70">Do next</div>
                    <div className="mt-2 text-base text-white">{getNodeNextAction(activeMission, tree)}</div>
                    <div className="mt-2 text-sm text-slate-400">{getNodeNextActionContext(activeMission, tree)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-white/10 bg-slate-950/70 p-0">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Quests</div>
                      <div className="mt-1 font-heading text-lg uppercase tracking-[0.08em] text-white">{activeMission.quests?.length ?? 0} queued</div>
                    </div>
                  </div>
                  {(activeMission.quests ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {(activeMission.quests ?? []).map((quest) => (
                        <div key={quest} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                          {quest}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                      No quests added yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-white/10 bg-slate-950/70 p-0">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div><div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Milestones</div><div className="mt-1 font-heading text-lg uppercase tracking-[0.08em] text-white">{progress?.completedCount ?? 0}/{progress?.totalCount ?? 0} clear</div></div>
                    <div className="text-xs text-slate-400">{getVisibleProgressLabel(activeMission, tree)}</div>
                  </div>
                  {activeMission.milestones.map((milestone) => <MilestoneItem key={milestone.id} milestone={milestone} onToggle={() => updateMilestone(milestone.id, (current) => updateMilestoneCompletion(current, !isMilestoneComplete(current)))} onIncrement={() => updateMilestone(milestone.id, (current) => current.progressType === "numeric" ? updateMilestoneValue(current, (current.currentValue ?? 0) + 1) : updateMilestoneCompletion(current, !isMilestoneComplete(current)))} onEvidenceChange={(evidence) => updateMilestone(milestone.id, (current) => ({ ...current, evidence }))} />)}
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(28,8,34,0.85),rgba(8,9,18,0.92))] p-0">
                <CardContent className="space-y-3 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-fuchsia-100/80">Final proof</div>
                  <div className="font-heading text-lg uppercase tracking-[0.08em] text-white">{activeMission.demonstration.title}</div>
                  <div className="text-sm text-slate-300">{activeMission.demonstration.description}</div>
                  <Button className={cn("w-full rounded-full", activeMission.demonstration.completed ? "bg-fuchsia-300 text-slate-950 hover:bg-fuchsia-200" : "bg-cyan-300 text-slate-950 hover:bg-cyan-200")} onClick={() => updateDemonstration((demo) => ({ ...demo, completed: !demo.completed, completedAt: !demo.completed ? new Date().toISOString() : undefined }))}><Check className="size-4" />{activeMission.demonstration.completed ? "Proof logged" : "Mark proof complete"}</Button>
                </CardContent>
              </Card>

              <DisclosureCard label="Logs" title="Supporting work" open={secondaryOpen === "logs"} onToggle={() => setSecondaryOpen(secondaryOpen === "logs" ? null : "logs")}>
                <div className="space-y-3">
                  <div className="font-mono text-sm uppercase tracking-[0.22em] text-slate-300">{formatDuration(elapsedSeconds)}</div>
                  <textarea value={sessionNote} onChange={(event) => setSessionNote(event.target.value)} rows={3} placeholder="Quick note" className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
                  <div className="grid grid-cols-2 gap-2">{ACTIVITY_TYPES.slice(0, 4).map((activity) => <button key={activity.id} type="button" onClick={() => setSelectedActivityType(activity.id)} className={cn("rounded-2xl border px-3 py-2 text-xs uppercase tracking-[0.18em]", selectedActivityType === activity.id ? "border-cyan-300/50 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-400")}>{activity.label}</button>)}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={onToggleTimer}>{timerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}{timerRunning ? "Pause" : "Start"}</Button>
                    <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => { onCommitTimerSession(sessionNote || undefined); setSessionNote(""); }} disabled={elapsedSeconds === 0}><Sparkles className="size-4" />Log timer</Button>
                    <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onResetTimer}><RotateCcw className="size-4" />Reset</Button>
                  </div>
                  <div className="flex gap-2">{[10, 20, 40].map((minutes) => <Button key={minutes} variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => onQuickLog(minutes, selectedActivityType, sessionNote || undefined)}>+{minutes}m</Button>)}</div>
                  <div className="space-y-2">{nodeSessions.map((session) => <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">{session.minutes}m {session.activityLabel}{session.note ? ` - ${session.note}` : ""}</div>)}</div>
                </div>
              </DisclosureCard>

              <DisclosureCard label="Details" title="Connections" open={secondaryOpen === "details"} onToggle={() => setSecondaryOpen(secondaryOpen === "details" ? null : "details")}>
                <div className="space-y-2">
                  {activeMission.prerequisites.length === 0 ? <div className="text-sm text-slate-400">No prerequisites yet.</div> : activeMission.prerequisites.map((id) => { const node = tree.find((item) => item.id === id); return <div key={id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"><span>{node?.title ?? id}</span><button type="button" className="text-slate-500" onClick={() => onUpdateNode({ ...activeMission, prerequisites: activeMission.prerequisites.filter((item) => item !== id) })}>Remove</button></div>; })}
                </div>
              </DisclosureCard>
            </>
          ) : (
            <Card className="rounded-[28px] border border-white/10 bg-slate-950/70 p-0"><CardContent className="p-4 text-sm text-slate-400">Pick a node to see what to do next.</CardContent></Card>
          )}
        </div>
      </div>

      {editorOpen ? <NodeEditorSheet key={editingNode?.id ?? "new-node"} editingNode={editingNode} isOpen={editorOpen} onClose={() => { setEditorOpen(false); setEditingNode(null); }} onDelete={editingNode ? () => { onDeleteNode(editingNode.id); setEditorOpen(false); setEditingNode(null); } : undefined} onSave={(values) => { if (editingNode) { onUpdateNode({ ...editingNode, title: values.title, branch: values.branch || "Custom Branch", description: values.description || "A custom mastery node.", quests: values.quests, nodeType: values.nodeType, prerequisites: values.prerequisiteIds, milestones: values.milestones.length > 0 ? values.milestones : editingNode.milestones, capstoneGoal: values.capstoneGoal, intendedOutcome: values.intendedOutcome, demonstrationBypassesMilestones: values.demonstrationBypassesMilestones, demonstration: { ...editingNode.demonstration, title: values.demonstrationTitle || editingNode.demonstration.title, description: values.demonstrationDescription || editingNode.demonstration.description } }); } else { onAddNode(values); } setEditorOpen(false); setEditingNode(null); }} tree={tree} /> : null}
      {importOpen ? <NodeImportSheet key={`import-${activeMission?.id ?? "none"}-${selectedPath.id}`} activeNode={activeMission ?? null} defaultBranch={activeMission?.branch ?? selectedPath.name} isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={onImportNodes} /> : null}
    </div>
  );
}

function MilestoneItem({ milestone, onEvidenceChange, onIncrement, onToggle }: { milestone: Milestone; onEvidenceChange: (evidence: EvidenceFields) => void; onIncrement: () => void; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return <div className={cn("rounded-[22px] border px-4 py-3", isMilestoneComplete(milestone) ? "border-cyan-300/35 bg-cyan-400/10" : "border-white/10 bg-white/5")}><div className="flex items-start justify-between gap-3"><div><div className="text-sm text-white">{milestone.title}</div><div className="mt-1 text-xs text-slate-400">{milestone.description}</div></div><div className="flex gap-2">{milestone.progressType === "numeric" ? <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onIncrement}>+1</Button> : null}<Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onToggle}>{isMilestoneComplete(milestone) ? "Done" : "Mark"}</Button></div></div><button type="button" className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-200/80" onClick={() => setOpen((current) => !current)}><ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />Evidence</button><AnimatePresence initial={false}>{open ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="pt-3"><textarea value={milestone.evidence?.note ?? ""} onChange={(event) => onEvidenceChange({ ...(milestone.evidence ?? {}), note: event.target.value })} rows={2} placeholder="What proved progress?" className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500" /></div></motion.div> : null}</AnimatePresence></div>;
}

function DisclosureCard({ children, label, title, open, onToggle }: { children: ReactNode; label: string; title: string; open: boolean; onToggle: () => void }) {
  return <Card className="rounded-[28px] border border-white/10 bg-slate-950/70 p-0"><CardContent className="p-3"><button type="button" onClick={onToggle} className="flex w-full items-center justify-between rounded-[20px] px-2 py-2 text-left"><div><div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div><div className="mt-1 font-heading text-lg uppercase tracking-[0.08em] text-white">{title}</div></div><ChevronRight className={cn("size-4 text-slate-500 transition-transform", open && "rotate-90")} /></button><AnimatePresence initial={false}>{open ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="px-2 pb-2 pt-1">{children}</div></motion.div> : null}</AnimatePresence></CardContent></Card>;
}

function Tag({ children }: { children: ReactNode }) { return <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">{children}</span>; }
function StatePill({ state }: { state: ReturnType<typeof getNodeState> }) { return <span className={cn("rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em]", state === "locked" && "border border-slate-700/60 bg-slate-900/70 text-slate-400", state === "available" && "border border-sky-200/25 bg-sky-300/10 text-sky-100", state === "in-progress" && "border border-cyan-300/35 bg-cyan-400/10 text-cyan-100", state === "mastered" && "border border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100")}>{state.replace("-", " ")}</span>; }
