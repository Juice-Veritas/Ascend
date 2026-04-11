
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Session } from "@supabase/supabase-js";

import { CommandDeckCompact } from "@/components/ascend/command-deck-compact";
import { SkillTreeScreenRefined } from "@/components/ascend/skill-tree-screen-refined";
import {
  DEFAULT_CATALOG,
  type ActivityTypeId,
  type PathDefinition,
  type PathId,
  type SessionLog,
  type SkillNode,
  type TreeCatalog,
} from "@/lib/ascend-data";
import {
  createGeneratedTree,
  createPathDefinition,
  readTreeCatalog,
  writeTreeCatalog,
} from "@/lib/ascend-catalog-storage";
import {
  createStructuredTreeLayout,
  isNodePositionOutOfBounds,
  normalizeNodePosition,
} from "@/lib/ascend-layout";
import {
  fetchSupabaseSession,
  loadRemoteAscendState,
  saveRemoteAscendState,
  sendMagicLink,
  signOutSupabase,
} from "@/lib/ascend-sync";
import {
  defaultAscendState,
  readLocalAscendState,
  type PersistedAscendState,
  writeLocalAscendState,
} from "@/lib/ascend-storage";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import {
  deriveMomentumSummary,
  derivePathSignal,
  derivePathMissionSummaries,
  deriveTodayRecommendations,
  getNodeById,
  getNodeCharge,
  getVisibleProgressLabel,
  logSessionProgress,
} from "@/lib/ascend-engine";

type Screen = "paths" | "tree";
type SessionFeedback = SessionLog & { visibleLabel: string };

const DEFAULT_MILESTONES = {
  foundation: ["Lock the baseline", "Repeat the base work", "Capture one proof"],
  skill: ["Define the standard", "Accumulate meaningful reps", "Capture applied evidence"],
  capstone: ["Clarify the proof", "Run a full attempt", "Review the result"],
} as const;

export function AscendApp() {
  const [screen, setScreen] = useState<Screen>("paths");
  const [catalog, setCatalog] = useState<TreeCatalog>(DEFAULT_CATALOG);
  const [selectedPathId, setSelectedPathId] = useState<PathId>(defaultAscendState.selectedPathId);
  const [activeMissionId, setActiveMissionId] = useState(defaultAscendState.activeMissionId);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionFeed, setSessionFeed] = useState<SessionLog[]>(defaultAscendState.sessionFeed);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityTypeId>(defaultAscendState.selectedActivityType);
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<"offline" | "local" | "syncing" | "synced">(hasSupabaseEnv ? "local" : "offline");
  const [session, setSession] = useState<Session | null>(null);
  const [hasHydratedState, setHasHydratedState] = useState(false);
  const [hasResolvedRemote, setHasResolvedRemote] = useState(!hasSupabaseEnv);

  const tree = catalog.skillTrees[selectedPathId] ?? [];
  const selectedPath = catalog.paths.find((path) => path.id === selectedPathId) ?? DEFAULT_CATALOG.paths[0];
  const activeMission = getNodeById(tree, activeMissionId) ?? tree[0];
  const activeMissionCharge = activeMission ? getNodeCharge(activeMission) : 0;

  const pathSignals = useMemo(
    () => Object.fromEntries(catalog.paths.map((path) => [path.id, derivePathSignal(path.id, catalog.skillTrees[path.id] ?? [])])) as Record<PathId, ReturnType<typeof derivePathSignal>>,
    [catalog]
  );
  const todayRecommendations = useMemo(() => deriveTodayRecommendations(catalog, sessionFeed, 4), [catalog, sessionFeed]);
  const missionSummaries = useMemo(() => derivePathMissionSummaries(catalog), [catalog]);
  const momentumSummary = useMemo(() => deriveMomentumSummary(catalog, sessionFeed), [catalog, sessionFeed]);

  function applyPersistedState(state: PersistedAscendState) {
    setSelectedPathId(state.selectedPathId);
    setActiveMissionId(state.activeMissionId);
    setSelectedActivityType(state.selectedActivityType);
    setSessionFeed(state.sessionFeed);
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCatalog(readTreeCatalog());
      applyPersistedState(readLocalAscendState());
      setHasHydratedState(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!timerRunning) {
      return;
    }
    const interval = window.setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (!sessionFeedback) {
      return;
    }
    const timeout = window.setTimeout(() => setSessionFeedback(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [sessionFeedback]);

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) {
      return;
    }

    let active = true;
    fetchSupabaseSession().then((nextSession) => {
      if (!active) {
        return;
      }
      setSession(nextSession);
      setAuthStatus(nextSession ? "syncing" : "local");
      setAuthEmail(nextSession?.user.email ?? "");
      setHasResolvedRemote(!nextSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthStatus(nextSession ? "syncing" : "local");
      setAuthEmail(nextSession?.user.email ?? "");
      setHasResolvedRemote(!nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedState || !session) {
      return;
    }

    let active = true;
    loadRemoteAscendState(session)
      .then((remoteState) => {
        if (!active) {
          return;
        }
        if (!remoteState) {
          setHasResolvedRemote(true);
          return;
        }
        setCatalog(remoteState.catalog);
        applyPersistedState(remoteState.state);
        writeTreeCatalog(remoteState.catalog);
        writeLocalAscendState(remoteState.state);
        setAuthStatus("synced");
        setHasResolvedRemote(true);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setAuthStatus("local");
        setHasResolvedRemote(true);
        setAuthMessage(error instanceof Error ? error.message : "Unable to load synced state.");
      });

    return () => {
      active = false;
    };
  }, [hasHydratedState, session]);

  useEffect(() => {
    if (!hasHydratedState) {
      return;
    }

    const nextState: PersistedAscendState = {
      selectedPathId,
      activeMissionId,
      selectedActivityType,
      sessionFeed,
    };
    writeLocalAscendState(nextState);
    writeTreeCatalog(catalog);

    if (!session || !hasResolvedRemote) {
      return;
    }

    saveRemoteAscendState(session, nextState, catalog)
      .then(() => setAuthStatus("synced"))
      .catch((error: unknown) => {
        setAuthStatus("local");
        setAuthMessage(error instanceof Error ? error.message : "Unable to save synced state.");
      });
  }, [activeMissionId, catalog, hasHydratedState, hasResolvedRemote, selectedActivityType, selectedPathId, session, sessionFeed]);

  useEffect(() => {
    const currentTree = catalog.skillTrees[selectedPathId] ?? [];
    if (!currentTree.some((node) => isNodePositionOutOfBounds(node.position, node.nodeType))) {
      return;
    }

    setCatalog((current) => ({
      ...current,
      skillTrees: {
        ...current.skillTrees,
        [selectedPathId]: (current.skillTrees[selectedPathId] ?? []).map((node) => ({
          ...node,
          position: normalizeNodePosition(node.position, node.nodeType),
        })),
      },
    }));
  }, [catalog.skillTrees, selectedPathId]);

  function selectPath(path: PathDefinition) {
    setSelectedPathId(path.id);
    setActiveMissionId((catalog.skillTrees[path.id] ?? [])[0]?.id ?? "");
  }

  function enterPath(path: PathDefinition) {
    selectPath(path);
    setScreen("tree");
  }

  function registerSession(minutes: number, activityTypeId: ActivityTypeId, note?: string) {
    if (!activeMission) {
      return;
    }

    const sessionLog = logSessionProgress({ node: activeMission, minutes, activityTypeId, note });
    setSessionFeed((current) => [sessionLog, ...current].slice(0, 12));
    setElapsedSeconds(0);
    setTimerRunning(false);
    setSessionFeedback({ ...sessionLog, visibleLabel: "Supporting Work Logged" });
  }

  function handleCreatePath(name: string, capstones: string) {
    const path = createPathDefinition(name, catalog.paths.length);
    const generatedTree = createGeneratedTree(path.id, capstones.split(",").map((item) => item.trim()).filter(Boolean));
    setCatalog((current) => ({ paths: [...current.paths, path], skillTrees: { ...current.skillTrees, [path.id]: generatedTree } }));
    setSelectedPathId(path.id);
    setActiveMissionId(generatedTree[0]?.id ?? "");
    setScreen("tree");
  }
  function handleDeletePath(pathId: string) {
    if (pathId === "athletics") {
      return;
    }
    const deletedIds = new Set((catalog.skillTrees[pathId] ?? []).map((node) => node.id));
    setCatalog((current) => {
      const nextTrees = { ...current.skillTrees };
      delete nextTrees[pathId];
      return { paths: current.paths.filter((path) => path.id !== pathId), skillTrees: nextTrees };
    });
    setSessionFeed((current) => current.filter((sessionItem) => !deletedIds.has(sessionItem.nodeId)));
    setSelectedPathId("athletics");
    setActiveMissionId("physical-foundation");
    setScreen("paths");
  }

  function handleAddNode(values: {
    title: string;
    branch: string;
    description: string;
    prerequisiteIds: string[];
    milestones?: SkillNode["milestones"];
    nodeType: SkillNode["nodeType"];
    capstoneGoal?: string;
    intendedOutcome?: string;
    demonstrationBypassesMilestones?: boolean;
    demonstrationTitle?: string;
    demonstrationDescription?: string;
  }) {
    const currentTree = catalog.skillTrees[selectedPathId] ?? [];
    const branchNames = Array.from(new Set(currentTree.filter((node) => node.nodeType !== "capstone").map((node) => node.branch).concat(values.branch)));
    const laneIndex = Math.max(0, branchNames.indexOf(values.branch));
    const laneStep = branchNames.length <= 1 ? 0 : 58 / Math.max(1, branchNames.length - 1);
    const branchX = Math.round(21 + laneIndex * laneStep);
    const parent = currentTree.find((node) => node.id === values.prerequisiteIds[0]);
    const capstoneCount = currentTree.filter((node) => node.nodeType === "capstone").length + (values.nodeType === "capstone" ? 1 : 0);
    const capstoneStep = capstoneCount <= 1 ? 0 : 58 / Math.max(1, capstoneCount - 1);
    const capstoneX = Math.round(21 + currentTree.filter((node) => node.nodeType === "capstone").length * capstoneStep);
    const nextNode: SkillNode = {
      id: `${selectedPathId}-${Date.now()}`,
      pathId: selectedPathId,
      title: values.title,
      branch: values.branch,
      description: values.description,
      position: values.nodeType === "capstone" ? { x: capstoneX, y: 18 } : values.nodeType === "foundation" ? { x: branchX, y: 68 } : { x: parent ? parent.position.x : branchX, y: parent ? Math.max(36, parent.position.y - 14) : 48 },
      prerequisites: values.prerequisiteIds,
      nodeType: values.nodeType,
      milestones: values.milestones ?? DEFAULT_MILESTONES[values.nodeType].map((title, index) => ({ id: `${selectedPathId}-${Date.now()}-${index}`, title, description: `${title} for ${values.title}.`, progressType: index === 1 ? "numeric" : index === 2 ? "demonstration" : "checkbox", targetValue: index === 1 ? 5 : undefined, currentValue: index === 1 ? 0 : undefined, completed: false })),
      demonstration: {
        title: values.demonstrationTitle || `Demonstrate ${values.title}`,
        description:
          values.demonstrationDescription ||
          values.intendedOutcome ||
          `Show that ${values.title} is real outside the app.`,
        completed: false,
      },
      demonstrationBypassesMilestones: values.demonstrationBypassesMilestones,
      suggestions: ["Make the next action concrete.", "Bias evidence over vague effort.", "Keep the node tied to a bigger outcome."],
      capstoneGoal: values.capstoneGoal,
      intendedOutcome: values.intendedOutcome,
    };

    const positionedNode = {
      ...nextNode,
      position: findOpenNodePosition(nextNode.position, nextNode, currentTree),
    };

    setCatalog((current) => ({ ...current, skillTrees: { ...current.skillTrees, [selectedPathId]: [...(current.skillTrees[selectedPathId] ?? []), positionedNode] } }));
    setActiveMissionId(positionedNode.id);
  }

  function handleUpdateNode(updatedNode: SkillNode) {
    setCatalog((current) => ({ ...current, skillTrees: { ...current.skillTrees, [selectedPathId]: (current.skillTrees[selectedPathId] ?? []).map((node) => node.id === updatedNode.id ? updatedNode : node) } }));
  }

  function handleDeleteNode(nodeId: string) {
    const nextTree = (catalog.skillTrees[selectedPathId] ?? []).filter((node) => node.id !== nodeId);
    setCatalog((current) => ({ ...current, skillTrees: { ...current.skillTrees, [selectedPathId]: nextTree } }));
    setSessionFeed((current) => current.filter((item) => item.nodeId !== nodeId));
    setActiveMissionId(nextTree[0]?.id ?? "");
  }

  function handleMoveNode(nodeId: string, position: { x: number; y: number }) {
    setCatalog((current) => {
      const currentTree = current.skillTrees[selectedPathId] ?? [];
      const movingNode = currentTree.find((node) => node.id === nodeId);
      if (!movingNode) {
        return current;
      }

      const nextPosition = normalizeNodePosition(position, movingNode.nodeType);
      return {
        ...current,
        skillTrees: {
          ...current.skillTrees,
          [selectedPathId]: currentTree.map((node) => node.id === nodeId ? { ...node, position: nextPosition } : node),
        },
      };
    });
  }

  function handleTidyTree() {
    setCatalog((current) => ({
      ...current,
      skillTrees: {
        ...current.skillTrees,
        [selectedPathId]: createStructuredTreeLayout(current.skillTrees[selectedPathId] ?? []),
      },
    }));
  }

  async function handleSendMagicLink() {
    try {
      setAuthMessage(null);
      await sendMagicLink(authEmail);
      setAuthMessage("Magic link sent. Open it on any device to sync your state.");
    } catch (error: unknown) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to send magic link.");
    }
  }

  async function handleSignOut() {
    try {
      setAuthMessage(null);
      await signOutSupabase();
      setAuthStatus("local");
      setSession(null);
      setAuthMessage("Signed out. Local progress remains on this browser.");
    } catch (error: unknown) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to sign out.");
    }
  }

  const latestSession = sessionFeed[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(37,244,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(254,52,187,0.14),transparent_28%),linear-gradient(180deg,#060816_0%,#090c18_45%,#04050a_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(104,129,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(104,129,255,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(4,5,10,0.12)_52%,rgba(4,5,10,0.82)_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="font-mono text-xs uppercase tracking-[0.45em] text-cyan-300/80">Ascend</p>
            <h1 className="max-w-3xl font-heading text-3xl uppercase tracking-[0.14em] text-white sm:text-4xl">{screen === "paths" ? "Command Deck" : "Mastery Map"}</h1>
            <p className="max-w-2xl text-sm text-slate-400 sm:text-base">{screen === "paths" ? "Fast entry. Low drag." : `${selectedPath.name}. One node at a time.`}</p>
          </div>
          <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/60 px-4 py-3 shadow-[0_0_45px_rgba(37,244,238,0.08)] backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">Current</div>
            <div className="mt-2 flex items-end gap-3"><div className="font-heading text-2xl uppercase tracking-[0.12em] text-white">{selectedPath.name}</div><div className="pb-1 text-sm text-slate-300">{pathSignals[selectedPath.id]?.completionText ?? "Blueprint"}</div></div>
          </div>
        </header>
        <AnimatePresence mode="wait" initial={false}>
          {screen === "paths" ? (
            <motion.section key="paths" initial={{ opacity: 0, y: 24, clipPath: "inset(0 0 12% 0 round 36px)" }} animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0 round 36px)" }} exit={{ opacity: 0, y: -18, clipPath: "inset(0 0 8% 0 round 36px)" }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} className="flex-1 py-6">
              <CommandDeckCompact authEmail={authEmail} authMessage={authMessage} authStatus={authStatus} activeMissionCharge={activeMissionCharge} activeMissionName={activeMission?.title ?? null} latestSession={latestSession} missionSummaries={missionSummaries} momentumSummary={momentumSummary} onAuthEmailChange={setAuthEmail} onCreatePath={handleCreatePath} onDeletePath={handleDeletePath} onEnterPath={enterPath} onQuickLog={registerSession} onSendMagicLink={handleSendMagicLink} onSignOut={handleSignOut} onStartTimer={() => activeMission && setTimerRunning(true)} paths={catalog.paths} pathSignals={pathSignals} selectedActivityType={selectedActivityType} selectedPath={selectedPath} setSelectedActivityType={setSelectedActivityType} todayRecommendations={todayRecommendations} userEmail={session?.user.email ?? null} timerRunning={timerRunning} />
            </motion.section>
          ) : (
            <motion.section key="tree" initial={{ opacity: 0, y: 24, clipPath: "inset(0 0 12% 0 round 36px)" }} animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0 round 36px)" }} exit={{ opacity: 0, y: -18, clipPath: "inset(0 0 8% 0 round 36px)" }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} className="flex-1 py-6">
              <SkillTreeScreenRefined activeMissionId={activeMissionId} elapsedSeconds={elapsedSeconds} onAddNode={handleAddNode} onBack={() => setScreen("paths")} onCommitTimerSession={(note) => registerSession(Math.max(1, Math.round(elapsedSeconds / 60)), selectedActivityType, note)} onDeleteNode={handleDeleteNode} onMoveNode={handleMoveNode} onQuickLog={registerSession} onResetTimer={() => { setTimerRunning(false); setElapsedSeconds(0); }} onSelectMission={setActiveMissionId} onTidyTree={handleTidyTree} onToggleTimer={() => activeMission && setTimerRunning((current) => !current)} onUpdateNode={handleUpdateNode} selectedActivityType={selectedActivityType} selectedPath={selectedPath} sessionFeed={sessionFeed} setSelectedActivityType={setSelectedActivityType} timerRunning={timerRunning} tree={tree} />
            </motion.section>
          )}
        </AnimatePresence>
        <AnimatePresence>{sessionFeedback ? <motion.div key={sessionFeedback.id} initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.32, ease: "easeOut" }} className="pointer-events-none absolute right-4 top-24 z-20 max-w-sm rounded-[28px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(11,17,34,0.95),rgba(7,11,21,0.92))] px-5 py-4 shadow-[0_0_45px_rgba(37,244,238,0.18)] backdrop-blur sm:right-6"><div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/80">{sessionFeedback.visibleLabel}</div><div className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">{sessionFeedback.nodeTitle}</div><div className="mt-2 text-sm text-slate-300">{sessionFeedback.minutes}m logged as <span className="text-cyan-300">{sessionFeedback.activityLabel}</span>. {sessionFeedback.feedback}</div></motion.div> : null}</AnimatePresence>
        <footer className="border-t border-white/10 py-4 text-xs uppercase tracking-[0.24em] text-slate-400">Focus: <span className="text-cyan-300">{activeMission ? getVisibleProgressLabel(activeMission, tree) : "Awaiting selection"}</span> on <span className="text-white">{activeMission?.title ?? "no node"}</span>.</footer>
      </div>
    </main>
  );
}
