"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Sparkles, WandSparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type ImportedNodeDraft, parseNodeBlueprint } from "@/lib/ascend-import";
import { type SkillNode } from "@/lib/ascend-data";
import { cn } from "@/lib/utils";

type NodeImportSheetProps = {
  activeNode: SkillNode | null;
  defaultBranch: string;
  isOpen: boolean;
  onClose: () => void;
  onImport: (payload: {
    nodes: ImportedNodeDraft[];
    attachToNodeId?: string;
    tidyLayout: boolean;
  }) => void;
};

const EXAMPLE_TEMPLATE = `NODE 1.1 - UI SYSTEMS
Skill Goal
Design clean systems that organize complex personal data

Quests
Build unified dashboard
Implement modular UI components

Milestones
UI is consistent across sections
Data is clearly structured and readable

Node Capstone
Personal Command Center v2
A dashboard you actually use daily`;

export function NodeImportSheet({
  activeNode,
  defaultBranch,
  isOpen,
  onClose,
  onImport,
}: NodeImportSheetProps) {
  const [rawText, setRawText] = useState("");
  const [fallbackBranch, setFallbackBranch] = useState(() => defaultBranch);
  const [drafts, setDrafts] = useState<ImportedNodeDraft[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [tidyLayout, setTidyLayout] = useState(true);
  const [attachToActiveNode, setAttachToActiveNode] = useState(false);

  if (!isOpen) {
    return null;
  }

  function handleParse() {
    const result = parseNodeBlueprint(rawText, { defaultBranch: fallbackBranch });
    setDrafts(result.nodes);
    setWarnings(result.warnings);
  }

  function updateDraft(draftId: string, transform: (draft: ImportedNodeDraft) => ImportedNodeDraft) {
    setDrafts((current) =>
      {
        const draftIds = new Set(current.map((draft) => draft.id));
        return current.map((draft) => {
          if (draft.id !== draftId) {
            return draft;
          }

          const next = transform(draft);
          return {
            ...next,
            prerequisiteIds: next.prerequisiteIds.filter((id) => draftIds.has(id) && id !== draftId),
          };
        });
      }
    );
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: 520 }}
        animate={{ x: 0 }}
        exit={{ x: 520 }}
        transition={{ duration: 0.26 }}
        className="fixed inset-y-0 right-0 z-[200] h-[100dvh] w-[min(680px,100vw)] overflow-y-auto border-l border-white/10 bg-[linear-gradient(180deg,rgba(7,10,22,0.99),rgba(5,8,18,0.98))] px-5 pb-8 pt-5 shadow-[-24px_0_60px_rgba(0,0,0,0.45)]"
      >
        <div className="space-y-4 pb-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">Import nodes</div>
              <h3 className="mt-2 font-heading text-2xl uppercase tracking-[0.1em] text-white">Paste node blueprint</h3>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Paste one node or a whole branch, parse it, review the structure, then import it into the current tree.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="size-4" />
              Close
            </Button>
          </div>

          <Card className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/8 p-0">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-100/80">
                <FileText className="size-3.5" />
                Supported template
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-6 text-slate-200">
                {EXAMPLE_TEMPLATE}
              </pre>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border border-white/10 bg-slate-950/70 p-0">
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
                <label className="block space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Fallback branch</span>
                  <input
                    value={fallbackBranch}
                    onChange={(event) => setFallbackBranch(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                    placeholder="Current branch"
                  />
                </label>
                <div className="space-y-2 text-sm text-slate-300">
                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={tidyLayout}
                      onChange={(event) => setTidyLayout(event.target.checked)}
                      className="mt-1"
                    />
                    <span>Tidy layout after import.</span>
                  </label>
                  {activeNode ? (
                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={attachToActiveNode}
                        onChange={(event) => setAttachToActiveNode(event.target.checked)}
                        className="mt-1"
                      />
                      <span>Connect the first imported node from {activeNode.title}.</span>
                    </label>
                  ) : null}
                </div>
              </div>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Blueprint text</span>
                <textarea
                  value={rawText}
                  onChange={(event) => setRawText(event.target.value)}
                  rows={14}
                  className="w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Paste one node or a whole branch here."
                />
              </label>
              <Button
                className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                onClick={handleParse}
                disabled={!rawText.trim()}
              >
                <WandSparkles className="size-4" />
                Parse blueprint
              </Button>
            </CardContent>
          </Card>

          {warnings.length > 0 ? (
            <Card className="rounded-[24px] border border-amber-300/20 bg-amber-400/8 p-0">
              <CardContent className="space-y-2 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-100/80">Parser notes</div>
                {warnings.map((warning) => (
                  <div key={warning} className="text-sm text-amber-50/90">
                    {warning}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {drafts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Preview</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Review the parsed structure, refine branches or connections, then confirm import.
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                  {drafts.length} node{drafts.length === 1 ? "" : "s"}
                </div>
              </div>

              {drafts.map((draft, index) => (
                <Card key={draft.id} className="rounded-[26px] border border-white/10 bg-slate-950/70 p-0">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200/70">
                          {draft.sequenceLabel ? `Node ${draft.sequenceLabel}` : `Node ${index + 1}`}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          Suggested links: {draft.prerequisiteIds.length > 0 ? draft.prerequisiteIds.length : 0}
                        </div>
                      </div>
                      <select
                        value={draft.nodeType}
                        onChange={(event) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            nodeType: event.target.value as SkillNode["nodeType"],
                          }))
                        }
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white outline-none"
                      >
                        <option value="foundation">Foundation</option>
                        <option value="skill">Skill</option>
                        <option value="capstone">Capstone</option>
                      </select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Title"
                        value={draft.title}
                        onChange={(value) => updateDraft(draft.id, (current) => ({ ...current, title: value }))}
                        placeholder="Node title"
                      />
                      <Field
                        label="Branch"
                        value={draft.branch}
                        onChange={(value) => updateDraft(draft.id, (current) => ({ ...current, branch: value }))}
                        placeholder="Branch label"
                      />
                    </div>

                    <TextField
                      label="Skill goal"
                      value={draft.description}
                      onChange={(value) => updateDraft(draft.id, (current) => ({ ...current, description: value }))}
                      placeholder="What this node is for."
                      rows={3}
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField
                        label="Quests"
                        value={draft.quests.join("\n")}
                        onChange={(value) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            quests: value.split("\n").map((item) => item.trim()).filter(Boolean),
                          }))
                        }
                        placeholder="One quest per line"
                        rows={4}
                      />
                      <TextField
                        label="Milestones"
                        value={draft.milestones.join("\n")}
                        onChange={(value) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            milestones: value.split("\n").map((item) => item.trim()).filter(Boolean),
                          }))
                        }
                        placeholder="One milestone per line"
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Capstone title"
                        value={draft.demonstrationTitle ?? ""}
                        onChange={(value) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            demonstrationTitle: value || undefined,
                            capstoneGoal: value || current.capstoneGoal,
                          }))
                        }
                        placeholder="Optional final proof"
                      />
                      <TextField
                        label="Capstone outcome"
                        value={draft.demonstrationDescription ?? draft.intendedOutcome ?? ""}
                        onChange={(value) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            demonstrationDescription: value || undefined,
                            intendedOutcome: value || undefined,
                          }))
                        }
                        placeholder="What should the capstone prove?"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Suggested connections</div>
                      <div className="flex flex-wrap gap-2">
                        {drafts
                          .filter((candidate) => candidate.id !== draft.id)
                          .map((candidate) => {
                            const selected = draft.prerequisiteIds.includes(candidate.id);
                            return (
                              <button
                                key={candidate.id}
                                type="button"
                                onClick={() =>
                                  updateDraft(draft.id, (current) => ({
                                    ...current,
                                    prerequisiteIds: selected
                                      ? current.prerequisiteIds.filter((id) => id !== candidate.id)
                                      : [...current.prerequisiteIds, candidate.id],
                                  }))
                                }
                                className={cn(
                                  "rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em]",
                                  selected
                                    ? "border-cyan-300/45 bg-cyan-400/10 text-white"
                                    : "border-white/10 bg-white/5 text-slate-400"
                                )}
                              >
                                {candidate.title}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          <div className="sticky bottom-0 flex flex-wrap gap-2 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,22,0.96),rgba(5,8,18,0.98))] p-3 backdrop-blur">
            <Button
              className="flex-1 rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={() => {
                onImport({
                  nodes: drafts,
                  attachToNodeId: attachToActiveNode ? activeNode?.id : undefined,
                  tidyLayout,
                });
                onClose();
              }}
              disabled={drafts.length === 0}
            >
              <Check className="size-4" />
              Confirm import
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={handleParse}
              disabled={!rawText.trim()}
            >
              <Sparkles className="size-4" />
              Parse again
            </Button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>,
    document.body
  );
}

function Field({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
      />
    </label>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  rows,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
      />
    </label>
  );
}
