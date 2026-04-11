"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Plus, Trash2, WandSparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Milestone, type SkillNode } from "@/lib/ascend-data";
import { milestoneGenerator } from "@/lib/ascend-milestone-generator";
import { cn } from "@/lib/utils";

type NodeEditorValues = {
  title: string;
  branch: string;
  description: string;
  prerequisiteIds: string[];
  milestones: Milestone[];
  nodeType: SkillNode["nodeType"];
  capstoneGoal?: string;
  intendedOutcome?: string;
  demonstrationBypassesMilestones?: boolean;
  demonstrationTitle?: string;
  demonstrationDescription?: string;
};

type NodeEditorSheetProps = {
  editingNode?: SkillNode | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onSave: (values: NodeEditorValues) => void;
  tree: SkillNode[];
};

const EMPTY_MILESTONE = (): Milestone => ({
  id: `milestone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  description: "",
  progressType: "checkbox",
  completed: false,
});

export function NodeEditorSheet({ editingNode, isOpen, onClose, onDelete, onSave, tree }: NodeEditorSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState("");
  const [description, setDescription] = useState("");
  const [nodeType, setNodeType] = useState<SkillNode["nodeType"]>("skill");
  const [prerequisiteIds, setPrerequisiteIds] = useState<string[]>([]);
  const [capstoneGoal, setCapstoneGoal] = useState("");
  const [intendedOutcome, setIntendedOutcome] = useState("");
  const [demonstrationTitle, setDemonstrationTitle] = useState("");
  const [demonstrationDescription, setDemonstrationDescription] = useState("");
  const [demonstrationBypassesMilestones, setDemonstrationBypassesMilestones] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [suggestions, setSuggestions] = useState<Milestone[]>([]);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading">("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep(0);
    setTitle(editingNode?.title ?? "");
    setBranch(editingNode?.branch ?? "");
    setDescription(editingNode?.description ?? "");
    setNodeType(editingNode?.nodeType ?? "skill");
    setPrerequisiteIds(editingNode?.prerequisites ?? []);
    setCapstoneGoal(editingNode?.capstoneGoal ?? "");
    setIntendedOutcome(editingNode?.intendedOutcome ?? "");
    setDemonstrationTitle(editingNode?.demonstration.title ?? "");
    setDemonstrationDescription(editingNode?.demonstration.description ?? "");
    setDemonstrationBypassesMilestones(Boolean(editingNode?.demonstrationBypassesMilestones));
    setMilestones(editingNode?.milestones ?? []);
    setSuggestions([]);
  }, [editingNode, isOpen]);

  async function generateSuggestions() {
    setAiStatus("loading");
    const next = await milestoneGenerator.suggest({
      nodeTitle: title || "Untitled node",
      nodeDescription: description,
      parentBranch: branch || "Custom Branch",
      nodeType,
      capstoneGoal: capstoneGoal || undefined,
      intendedOutcome: intendedOutcome || undefined,
    });
    setSuggestions(next.milestones);
    setDemonstrationTitle((current) => current || next.demonstrationTitle);
    setDemonstrationDescription((current) => current || next.demonstrationDescription);
    setAiStatus("idle");
  }

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ duration: 0.26 }} className="fixed inset-y-0 right-0 z-[200] h-[100dvh] w-[min(460px,100vw)] overflow-y-auto border-l border-white/10 bg-[linear-gradient(180deg,rgba(7,10,22,0.99),rgba(5,8,18,0.98))] px-5 pb-8 pt-5 shadow-[-24px_0_60px_rgba(0,0,0,0.45)]">
        <div className="space-y-4 pb-20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">{editingNode ? "Edit node" : "New node"}</div>
              <h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.1em] text-white">{editingNode ? editingNode.title : "Build a node"}</h3>
            </div>
            <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onClose}>
              <X className="size-4" />
              Close
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["Basics", "Context", "Path"].map((label, index) => (
              <button key={label} type="button" onClick={() => setStep(index)} className={cn("rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em]", step === index ? "border-cyan-300/45 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-400")}>
                {label}
              </button>
            ))}
          </div>

          {step === 0 ? (
            <EditorCard label="Step 1" title="Core">
              <InputField label="Name" value={title} onChange={setTitle} placeholder="Vertical Pull" />
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Type" value={nodeType} onChange={(value) => setNodeType(value as SkillNode["nodeType"])} options={[{ value: "foundation", label: "Foundation" }, { value: "skill", label: "Skill" }, { value: "capstone", label: "Capstone" }]} />
                <InputField label="Branch" value={branch} onChange={setBranch} placeholder="Calisthenics" />
              </div>
              <EditorCard label="Parent" title="Unlocks">
                <div className="space-y-2">
                  {tree.filter((node) => node.id !== editingNode?.id).map((node) => {
                    const selected = prerequisiteIds.includes(node.id);
                    return <button key={node.id} type="button" onClick={() => setPrerequisiteIds((current) => selected ? current.filter((id) => id !== node.id) : [...current, node.id])} className={cn("flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm", selected ? "border-cyan-300/45 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-300")}><span>{node.title}</span>{selected ? <Check className="size-4" /> : null}</button>;
                  })}
                </div>
              </EditorCard>
            </EditorCard>
          ) : null}

          {step === 1 ? (
            <EditorCard label="Step 2" title="Context">
              <TextAreaField label="Description" value={description} onChange={setDescription} placeholder="What this node means." />
              <TextAreaField label="Outcome" value={intendedOutcome} onChange={setIntendedOutcome} placeholder="What should become possible?" />
              <TextAreaField label="Capstone" value={capstoneGoal} onChange={setCapstoneGoal} placeholder="Optional bigger goal." />
              <InputField label="Final proof" value={demonstrationTitle} onChange={setDemonstrationTitle} placeholder="Demonstrate the standard" />
              <TextAreaField label="Proof details" value={demonstrationDescription} onChange={setDemonstrationDescription} placeholder="How mastery should be shown." />
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200"><input type="checkbox" checked={demonstrationBypassesMilestones} onChange={(event) => setDemonstrationBypassesMilestones(event.target.checked)} className="mt-1" /><span>Allow direct mastery from proof.</span></label>
            </EditorCard>
          ) : null}

          {step === 2 ? (
            <EditorCard label="Step 3" title="Milestones">
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Milestone {index + 1}</div>
                      <button type="button" onClick={() => setMilestones((current) => current.filter((item) => item.id !== milestone.id))} className="text-slate-500"><Trash2 className="size-4" /></button>
                    </div>
                    <InputField label="Title" value={milestone.title} onChange={(value) => setMilestones((current) => current.map((item) => item.id === milestone.id ? { ...item, title: value } : item))} placeholder="Lock the standard" />
                    <TextAreaField label="Description" value={milestone.description} onChange={(value) => setMilestones((current) => current.map((item) => item.id === milestone.id ? { ...item, description: value } : item))} placeholder="Short, concrete requirement." />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setMilestones((current) => [...current, EMPTY_MILESTONE()])}>
                <Plus className="size-4" />
                Add milestone
              </Button>
              <Card className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/8 p-0">
                <CardContent className="space-y-3 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-100/80">Suggestions</div>
                  <Button className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={generateSuggestions} disabled={aiStatus === "loading"}>
                    <Bot className="size-4" />
                    {aiStatus === "loading" ? "Generating..." : "Suggest milestones"}
                  </Button>
                  {suggestions.length > 0 ? (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => { setMilestones((current) => [...current, ...suggestions]); setSuggestions([]); }}>
                        <WandSparkles className="size-4" />
                        Accept all
                      </Button>
                      {suggestions.map((milestone) => (
                        <div key={milestone.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <div className="text-sm text-white">{milestone.title}</div>
                          <div className="mt-1 text-xs text-slate-300">{milestone.description}</div>
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => { setMilestones((current) => [...current, milestone]); setSuggestions((current) => current.filter((item) => item.id !== milestone.id)); }}>Accept</Button>
                            <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setSuggestions((current) => current.filter((item) => item.id !== milestone.id))}>Reject</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </EditorCard>
          ) : null}

          <div className="sticky bottom-0 flex flex-wrap gap-2 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,22,0.96),rgba(5,8,18,0.98))] p-3 backdrop-blur">
            <Button className="flex-1 rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={() => onSave({ title, branch, description, prerequisiteIds, milestones, nodeType, capstoneGoal: capstoneGoal || undefined, intendedOutcome: intendedOutcome || undefined, demonstrationBypassesMilestones, demonstrationTitle: demonstrationTitle || undefined, demonstrationDescription: demonstrationDescription || undefined })} disabled={!title.trim()}>
              <Check className="size-4" />
              Save node
            </Button>
            {onDelete ? <Button variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onDelete}><Trash2 className="size-4" />Delete</Button> : null}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>,
    document.body
  );
}

function EditorCard({ children, label, title }: { children: ReactNode; label: string; title: string }) {
  return <Card className="rounded-[26px] border border-white/10 bg-slate-950/70 p-0"><CardContent className="space-y-3 p-4"><div><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">{label}</div><div className="mt-1 font-heading text-lg uppercase tracking-[0.08em] text-white">{title}</div></div>{children}</CardContent></Card>;
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block space-y-2"><span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label>;
}

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block space-y-2"><span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="block space-y-2"><span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
