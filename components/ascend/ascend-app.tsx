"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Session } from "@supabase/supabase-js";

import { CommandDeck } from "@/components/ascend/command-deck";
import { SkillTreeScreen } from "@/components/ascend/skill-tree-screen";
import {
  ATHLETICS_TREE,
  PATHS,
  type ActivityTypeId,
  type PathDefinition,
  type PathId,
  type SessionLog,
} from "@/lib/ascend-data";
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
  derivePathSignal,
  getNodeById,
  getNodeCharge,
  getVisibleProgressLabel,
  logSessionProgress,
} from "@/lib/ascend-engine";

type Screen = "paths" | "tree";
type SessionFeedback = SessionLog & { visibleLabel: string };

export function AscendApp() {
  const [screen, setScreen] = useState<Screen>("paths");
  const [selectedPathId, setSelectedPathId] =
    useState<PathId>(defaultAscendState.selectedPathId);
  const [activeMissionId, setActiveMissionId] =
    useState(defaultAscendState.activeMissionId);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [xpByNode, setXpByNode] = useState<Record<string, number>>(
    defaultAscendState.xpByNode
  );
  const [sessionFeed, setSessionFeed] = useState<SessionLog[]>(
    defaultAscendState.sessionFeed
  );
  const [selectedActivityType, setSelectedActivityType] =
    useState<ActivityTypeId>(defaultAscendState.selectedActivityType);
  const [sessionFeedback, setSessionFeedback] =
    useState<SessionFeedback | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<
    "offline" | "local" | "syncing" | "synced"
  >(hasSupabaseEnv ? "local" : "offline");
  const [session, setSession] = useState<Session | null>(null);
  const [hasHydratedState, setHasHydratedState] = useState(false);

  const selectedPath = PATHS.find((path) => path.id === selectedPathId) ?? PATHS[0];
  const activeMission = getNodeById(activeMissionId);
  const activeMissionCharge = activeMission
    ? getNodeCharge(activeMission, xpByNode)
    : 0;

  const pathSignals = useMemo(
    () =>
      Object.fromEntries(
        PATHS.map((path) => [path.id, derivePathSignal(path.id, xpByNode)])
      ) as Record<PathId, ReturnType<typeof derivePathSignal>>,
    [xpByNode]
  );

  function applyPersistedState(state: PersistedAscendState) {
    setSelectedPathId(state.selectedPathId);
    setActiveMissionId(state.activeMissionId);
    setSelectedActivityType(state.selectedActivityType);
    setXpByNode(state.xpByNode);
    setSessionFeed(state.sessionFeed);
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const localState = readLocalAscendState();

      setSelectedPathId(localState.selectedPathId);
      setActiveMissionId(localState.activeMissionId);
      setSelectedActivityType(localState.selectedActivityType);
      setXpByNode(localState.xpByNode);
      setSessionFeed(localState.sessionFeed);
      setHasHydratedState(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (!sessionFeedback) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSessionFeedback(null);
    }, 2600);

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
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthStatus(nextSession ? "syncing" : "local");
      setAuthEmail(nextSession?.user.email ?? "");
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

        if (remoteState) {
          applyPersistedState(remoteState);
          writeLocalAscendState(remoteState);
        }

        setAuthStatus("synced");
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setAuthStatus("local");
        setAuthMessage(
          error instanceof Error ? error.message : "Unable to load synced state."
        );
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
      xpByNode,
      sessionFeed,
    };
    writeLocalAscendState(nextState);

    if (!session) {
      return;
    }

    saveRemoteAscendState(session, nextState)
      .then(() => {
        setAuthStatus("synced");
      })
      .catch((error: unknown) => {
        setAuthStatus("local");
        setAuthMessage(
          error instanceof Error ? error.message : "Unable to save synced state."
        );
      });
  }, [
    activeMissionId,
    hasHydratedState,
    selectedActivityType,
    selectedPathId,
    session,
    sessionFeed,
    xpByNode,
  ]);

  function openPath(path: PathDefinition) {
    setSelectedPathId(path.id);
    setScreen("tree");
  }

  function selectMission(nodeId: string) {
    setActiveMissionId(nodeId);
    setSelectedPathId("athletics");
  }

  function toggleTimer() {
    if (!activeMission) {
      return;
    }

    setTimerRunning((current) => !current);
  }

  function resetTimer() {
    setTimerRunning(false);
    setElapsedSeconds(0);
  }

  function registerSession(minutes: number, activityTypeId: ActivityTypeId) {
    if (!activeMission) {
      return;
    }

    const result = logSessionProgress({
      node: activeMission,
      minutes,
      activityTypeId,
      previousXpByNode: xpByNode,
    });

    setXpByNode(result.xpByNode);
    setElapsedSeconds(0);
    setTimerRunning(false);
    setSessionFeed((current) => [result.session, ...current].slice(0, 4));
    setSessionFeedback({
      ...result.session,
      visibleLabel: "Progress Registered",
    });
  }

  async function handleSendMagicLink() {
    try {
      setAuthMessage(null);
      await sendMagicLink(authEmail);
      setAuthMessage("Magic link sent. Open it on any device to sync your state.");
    } catch (error: unknown) {
      setAuthMessage(
        error instanceof Error ? error.message : "Unable to send magic link."
      );
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
      setAuthMessage(
        error instanceof Error ? error.message : "Unable to sign out."
      );
    }
  }

  function commitTimerSession() {
    const roundedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    registerSession(roundedMinutes, selectedActivityType);
  }

  const latestSession = sessionFeed[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(37,244,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(254,52,187,0.14),transparent_28%),linear-gradient(180deg,#060816_0%,#090c18_45%,#04050a_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(104,129,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(104,129,255,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(4,5,10,0.12)_52%,rgba(4,5,10,0.82)_100%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.45em] text-cyan-300/80">
              Cyberpunk Life RPG
            </p>
            <h1 className="max-w-3xl font-heading text-4xl uppercase tracking-[0.14em] text-white sm:text-5xl">
              Identity-driven progression, translated into visible momentum.
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              Choose a path, lock an active mission, and let focused sessions
              intensify the signal without exposing raw XP.
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/60 px-4 py-3 shadow-[0_0_45px_rgba(37,244,238,0.08)] backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">
              Current Signal
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="font-heading text-3xl uppercase tracking-[0.12em] text-white">
                {selectedPath.name}
              </div>
              <div className="pb-1 text-sm text-slate-300">
                {pathSignals[selectedPath.id].completionText}
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {screen === "paths" ? (
            <motion.section
              key="paths"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 py-6"
            >
              <CommandDeck
                authEmail={authEmail}
                authMessage={authMessage}
                authStatus={authStatus}
                activeMissionCharge={activeMissionCharge}
                activeMissionName={activeMission?.name ?? null}
                latestSession={latestSession}
                onAuthEmailChange={setAuthEmail}
                onOpenPath={openPath}
                onQuickLog={registerSession}
                onSendMagicLink={handleSendMagicLink}
                onSignOut={handleSignOut}
                onStartTimer={() => {
                  if (activeMission) {
                    setTimerRunning(true);
                  }
                }}
                paths={PATHS}
                pathSignals={pathSignals}
                selectedActivityType={selectedActivityType}
                setSelectedActivityType={setSelectedActivityType}
                userEmail={session?.user.email ?? null}
                timerRunning={timerRunning}
              />
            </motion.section>
          ) : (
            <motion.section
              key="tree"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 py-6"
            >
              <SkillTreeScreen
                activeMissionId={activeMissionId}
                elapsedSeconds={elapsedSeconds}
                latestSession={latestSession}
                onBack={() => setScreen("paths")}
                onCommitTimerSession={commitTimerSession}
                onQuickLog={registerSession}
                onResetTimer={resetTimer}
                onSelectMission={selectMission}
                onToggleTimer={toggleTimer}
                selectedActivityType={selectedActivityType}
                selectedPath={selectedPath}
                sessionFeed={sessionFeed}
                setSelectedActivityType={setSelectedActivityType}
                timerRunning={timerRunning}
                tree={ATHLETICS_TREE}
                xpByNode={xpByNode}
              />
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sessionFeedback ? (
            <>
              <motion.div
                key={`${sessionFeedback.id}-ripple`}
                initial={{ opacity: 0.45, scale: 0.25 }}
                animate={{ opacity: 0, scale: 1.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.15, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/40 bg-cyan-300/8"
              />
              <motion.div
                key={sessionFeedback.id}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className="pointer-events-none absolute right-4 top-24 z-20 max-w-sm rounded-[28px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(11,17,34,0.95),rgba(7,11,21,0.92))] px-5 py-4 shadow-[0_0_45px_rgba(37,244,238,0.18)] backdrop-blur sm:right-6"
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-cyan-300/80">
                  {sessionFeedback.visibleLabel}
                </div>
                <div className="mt-2 font-heading text-2xl uppercase tracking-[0.12em] text-white">
                  {sessionFeedback.nodeName}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {sessionFeedback.minutes}m logged as{" "}
                  <span className="text-cyan-300">
                    {sessionFeedback.activityLabel}
                  </span>
                  . {sessionFeedback.feedback}
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>

        <footer className="border-t border-white/10 py-4 text-xs uppercase tracking-[0.24em] text-slate-400">
          Active mission status:{" "}
          <span className="text-cyan-300">
            {activeMission
              ? getVisibleProgressLabel(activeMission, xpByNode)
              : "Awaiting selection"}
          </span>{" "}
          for <span className="text-white">{activeMission?.name ?? "no mission"}</span>.
        </footer>
      </div>
    </main>
  );
}
