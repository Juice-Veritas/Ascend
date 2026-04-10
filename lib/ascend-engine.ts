import {
  ACTIVITY_TYPES,
  type ActivityTypeId,
  type Milestone,
  type NodeState,
  type PathId,
  type SessionLog,
  type SkillNode,
  type TreeCatalog,
} from "@/lib/ascend-data";

export type MomentumSummary = {
  activeToday: boolean;
  recentTransmissions: number;
  recentDaysActive: number;
  weeklyCompletions: number;
};

export type TodayRecommendationReason =
  | "nearest-to-completion"
  | "blocked-by-demonstration"
  | "recently-active"
  | "foundational-prerequisite";

export type TodayRecommendation = {
  id: string;
  pathId: PathId;
  pathName: string;
  nodeId: string;
  nodeTitle: string;
  action: string;
  context: string;
  reason: TodayRecommendationReason;
  reasonLabel: string;
  score: number;
};

export type PathMissionSummary = {
  pathId: PathId;
  pathName: string;
  nodeId: string;
  nodeTitle: string;
  statusLabel: string;
  action: string;
};

export function getNodeById(nodes: SkillNode[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId);
}

export function isMilestoneComplete(milestone: Milestone) {
  if (milestone.progressType === "numeric") {
    return (milestone.currentValue ?? 0) >= (milestone.targetValue ?? 0);
  }

  return milestone.completed;
}

export function getRequiredMilestones(node: SkillNode) {
  return node.milestones.filter((milestone) => milestone.required !== false);
}

export function getMilestoneProgress(node: SkillNode) {
  const requiredMilestones = getRequiredMilestones(node);
  const completedCount = requiredMilestones.filter(isMilestoneComplete).length;
  const totalCount = requiredMilestones.length;
  const ratio = totalCount === 0 ? 1 : completedCount / totalCount;

  return {
    completedCount,
    totalCount,
    ratio,
    remainingCount: Math.max(0, totalCount - completedCount),
    allRequiredMilestonesComplete: totalCount === 0 || completedCount === totalCount,
  };
}

export function canNodeBypassMilestones(node: SkillNode) {
  return Boolean(node.demonstrationBypassesMilestones);
}

export function getNodeState(node: SkillNode, nodes: SkillNode[]): NodeState {
  const prerequisitesMet =
    node.prerequisites.length === 0 ||
    node.prerequisites.every((prerequisiteId) => {
      const prerequisite = getNodeById(nodes, prerequisiteId);
      return prerequisite ? getNodeState(prerequisite, nodes) === "mastered" : false;
    });

  if (!prerequisitesMet) {
    return "locked";
  }

  const milestoneProgress = getMilestoneProgress(node);
  const demonstrationComplete = node.demonstration.completed;
  const canMaster =
    demonstrationComplete &&
    (milestoneProgress.allRequiredMilestonesComplete || canNodeBypassMilestones(node));

  if (canMaster) {
    return "mastered";
  }

  if (milestoneProgress.completedCount > 0 || demonstrationComplete) {
    return "in-progress";
  }

  return "available";
}

export function getNodeCharge(node: SkillNode) {
  const milestoneProgress = getMilestoneProgress(node);
  const demonstrationBonus = node.demonstration.completed ? 0.18 : 0;
  return Math.max(0.08, Math.min(1, milestoneProgress.ratio * 0.82 + demonstrationBonus));
}

export function getVisibleProgressLabel(node: SkillNode, nodes: SkillNode[]) {
  const state = getNodeState(node, nodes);
  const progress = getMilestoneProgress(node);

  if (state === "locked") {
    return "Locked";
  }
  if (state === "available") {
    return progress.totalCount > 0 ? "Ready to begin" : "Ready";
  }
  if (state === "mastered") {
    return "Mastered";
  }
  if (node.demonstration.completed) {
    return "Awaiting full milestone closure";
  }

  return `${progress.completedCount}/${progress.totalCount} milestones complete`;
}

function getMilestoneActionLabel(milestone: Milestone) {
  if (milestone.progressType === "numeric") {
    return `Complete milestone: ${milestone.title} (${milestone.currentValue ?? 0}/${milestone.targetValue ?? 0})`;
  }

  if (milestone.progressType === "demonstration") {
    return `Record proof: ${milestone.title}`;
  }

  return `Complete milestone: ${milestone.title}`;
}

function isPrototypeBiasedNode(node: SkillNode) {
  const text = `${node.title} ${node.description} ${node.branch} ${node.capstoneGoal ?? ""} ${node.intendedOutcome ?? ""}`.toLowerCase();
  return [
    "prototype",
    "rig",
    "optic",
    "display",
    "sensor",
    "embedded",
    "build",
    "experiment",
    "hardware",
  ].some((token) => text.includes(token));
}

export function getNodeNextAction(node: SkillNode, nodes: SkillNode[]) {
  const missingPrerequisite = node.prerequisites
    .map((prerequisiteId) => getNodeById(nodes, prerequisiteId))
    .find((prerequisite) => prerequisite && getNodeState(prerequisite, nodes) !== "mastered");

  if (missingPrerequisite) {
    return `Advance prerequisite: ${missingPrerequisite.title}.`;
  }

  const nextMilestone = getRequiredMilestones(node).find((milestone) => !isMilestoneComplete(milestone));
  if (nextMilestone) {
    return getMilestoneActionLabel(nextMilestone);
  }

  if (!node.demonstration.completed) {
    return `Record proof of mastery: ${node.demonstration.title}.`;
  }

  return "Node mastered. Capture the next branch that should move.";
}

export function getNodeNextActionContext(node: SkillNode, nodes: SkillNode[]) {
  const progress = getMilestoneProgress(node);

  if (node.demonstration.completed && !progress.allRequiredMilestonesComplete) {
    return "Proof is captured. Close the remaining required milestones to lock mastery.";
  }

  const missingPrerequisite = node.prerequisites
    .map((prerequisiteId) => getNodeById(nodes, prerequisiteId))
    .find((prerequisite) => prerequisite && getNodeState(prerequisite, nodes) !== "mastered");
  if (missingPrerequisite) {
    return `${missingPrerequisite.title} still gates this node.`;
  }

  if (!node.demonstration.completed && progress.allRequiredMilestonesComplete) {
    return "All required milestones are complete. Only the final proof remains.";
  }

  return progress.totalCount > 0
    ? `${progress.remainingCount} required milestone${progress.remainingCount === 1 ? "" : "s"} remaining.`
    : "Ready for a concrete proof step.";
}

export function updateMilestoneCompletion(milestone: Milestone, completed: boolean) {
  if (milestone.progressType === "numeric") {
    const target = milestone.targetValue ?? 0;
    const currentValue = completed ? target : 0;
    return {
      ...milestone,
      currentValue,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    };
  }

  return {
    ...milestone,
    completed,
    completedAt: completed ? new Date().toISOString() : undefined,
  };
}

export function updateMilestoneValue(milestone: Milestone, currentValue: number) {
  const targetValue = milestone.targetValue ?? 0;
  const completed = milestone.progressType === "numeric" ? currentValue >= targetValue : milestone.completed;

  return {
    ...milestone,
    currentValue,
    completed,
    completedAt: completed ? milestone.completedAt ?? new Date().toISOString() : undefined,
  };
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function logSessionProgress({
  node,
  minutes,
  activityTypeId,
  note,
}: {
  node: SkillNode;
  minutes: number;
  activityTypeId: ActivityTypeId;
  note?: string;
}): SessionLog {
  const activityType =
    ACTIVITY_TYPES.find((item) => item.id === activityTypeId) ?? ACTIVITY_TYPES[1];

  return {
    id: `${node.id}-${Date.now()}`,
    nodeId: node.id,
    nodeTitle: node.title,
    minutes,
    activityTypeId,
    activityLabel: activityType.label,
    note,
    createdAt: new Date().toISOString(),
    feedback:
      activityTypeId === "output"
        ? "Output logged. Tie it back to a milestone or demonstration while it is still fresh."
        : "Supporting work logged. Use it to inform what you do next, not to auto-complete mastery.",
  };
}

export function derivePathSignal(pathId: PathId, nodes: SkillNode[]) {
  const pathNodes = nodes.filter((node) => node.pathId === pathId);

  if (pathNodes.length === 0) {
    return {
      completionText: "Blueprint forming",
      signalBars: 1,
      glowStrength: 0.12,
      activeNodes: 0,
      masteredNodes: 0,
    };
  }

  const masteredNodes = pathNodes.filter((node) => getNodeState(node, pathNodes) === "mastered").length;
  const activeNodes = pathNodes.filter((node) => getNodeState(node, pathNodes) === "in-progress").length;
  const averageCharge =
    pathNodes.reduce((sum, node) => sum + getNodeCharge(node), 0) / pathNodes.length;

  return {
    completionText:
      masteredNodes > 0
        ? `${masteredNodes}/${pathNodes.length} nodes mastered`
        : activeNodes > 0
          ? "Mastery is underway"
          : "Blueprint forming",
    signalBars: Math.max(1, Math.ceil(averageCharge * 4)),
    glowStrength: averageCharge,
    activeNodes,
    masteredNodes,
  };
}

function isWithinLastDays(timestamp: string | undefined, days: number) {
  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.valueOf())) {
    return false;
  }

  return Date.now() - date.valueOf() <= days * 24 * 60 * 60 * 1000;
}

export function deriveMomentumSummary(catalog: TreeCatalog, sessionFeed: SessionLog[]): MomentumSummary {
  const sessionDays = new Set(
    sessionFeed
      .filter((session) => isWithinLastDays(session.createdAt, 7))
      .map((session) => new Date(session.createdAt).toISOString().slice(0, 10))
  );

  let weeklyCompletions = 0;
  for (const nodes of Object.values(catalog.skillTrees)) {
    for (const node of nodes) {
      weeklyCompletions += node.milestones.filter((milestone) => isWithinLastDays(milestone.completedAt, 7)).length;
      if (isWithinLastDays(node.demonstration.completedAt, 7)) {
        weeklyCompletions += 1;
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return {
    activeToday: sessionDays.has(today),
    recentTransmissions: sessionFeed.slice(0, 5).length,
    recentDaysActive: sessionDays.size,
    weeklyCompletions,
  };
}

export function derivePathMissionSummaries(catalog: TreeCatalog): PathMissionSummary[] {
  return catalog.paths.flatMap((path) => {
    const tree = catalog.skillTrees[path.id] ?? [];
    const candidates = tree.filter((node) => {
      const state = getNodeState(node, tree);
      return state === "available" || state === "in-progress";
    });

    const chosen = candidates.sort((a, b) => getNodeCharge(b) - getNodeCharge(a))[0];

    if (!chosen) {
      return [];
    }

    return {
      pathId: path.id,
      pathName: path.name,
      nodeId: chosen.id,
      nodeTitle: chosen.title,
      statusLabel: getVisibleProgressLabel(chosen, tree),
      action: getNodeNextAction(chosen, tree),
    };
  });
}

export function deriveTodayRecommendations(
  catalog: TreeCatalog,
  sessionFeed: SessionLog[],
  limit = 4
): TodayRecommendation[] {
  const recentNodeIds = new Set(
    sessionFeed.filter((session) => isWithinLastDays(session.createdAt, 3)).map((session) => session.nodeId)
  );
  const results: TodayRecommendation[] = [];

  for (const path of catalog.paths) {
    const tree = catalog.skillTrees[path.id] ?? [];

    for (const node of tree) {
      const state = getNodeState(node, tree);
      if (state === "locked" || state === "mastered") {
        continue;
      }

      const progress = getMilestoneProgress(node);
      let score = progress.ratio * 50;
      let reason: TodayRecommendationReason = "nearest-to-completion";
      let reasonLabel = "Nearest to completion";

      if (!node.demonstration.completed && progress.allRequiredMilestonesComplete) {
        score += 45;
        reason = "blocked-by-demonstration";
        reasonLabel = "Blocked by demonstration";
      } else if (recentNodeIds.has(node.id)) {
        score += 36;
        reason = "recently-active";
        reasonLabel = "Recently active";
      } else if (node.nodeType === "foundation" && state === "available") {
        score += 28;
        reason = "foundational-prerequisite";
        reasonLabel = "Foundational prerequisite";
      } else {
        score += 22;
      }

      if (path.id === "science-tech" && isPrototypeBiasedNode(node)) {
        score += 18;
      }

      results.push({
        id: `${path.id}-${node.id}`,
        pathId: path.id,
        pathName: path.name,
        nodeId: node.id,
        nodeTitle: node.title,
        action: getNodeNextAction(node, tree),
        context: getNodeNextActionContext(node, tree),
        reason,
        reasonLabel,
        score,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(5, Math.max(3, limit)));
}
