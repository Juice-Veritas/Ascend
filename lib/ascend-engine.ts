import {
  ACTIVITY_TYPES,
  ATHLETICS_TREE,
  type ActivityTypeId,
  type NodeState,
  type PathId,
  type SessionLog,
  type SkillNode,
} from "@/lib/ascend-data";

export function getNodeById(nodeId: string) {
  return ATHLETICS_TREE.find((node) => node.id === nodeId);
}

export function getNodeState(
  node: SkillNode,
  xpByNode: Record<string, number>
): NodeState {
  const xp = xpByNode[node.id] ?? 0;

  if (xp >= node.targetXp) {
    return "COMPLETED";
  }

  if (xp > 0) {
    return "IN_PROGRESS";
  }

  if (
    node.requirements.length === 0 ||
    node.requirements.every(
      (requirementId) =>
        (xpByNode[requirementId] ?? 0) >=
        (getNodeById(requirementId)?.targetXp ?? Number.POSITIVE_INFINITY)
    )
  ) {
    return "AVAILABLE";
  }

  return "LOCKED";
}

export function getNodeCharge(
  node: SkillNode,
  xpByNode: Record<string, number>
) {
  const xp = xpByNode[node.id] ?? 0;
  return Math.max(0.06, Math.min(1, xp / node.targetXp));
}

export function getVisibleProgressLabel(
  node: SkillNode,
  xpByNode: Record<string, number>
) {
  const charge = getNodeCharge(node, xpByNode);
  const state = getNodeState(node, xpByNode);

  if (state === "LOCKED") {
    return "Offline";
  }
  if (state === "AVAILABLE") {
    return "Primed";
  }
  if (state === "COMPLETED") {
    return "Ascended";
  }
  if (charge < 0.33) {
    return "Stirring";
  }
  if (charge < 0.66) {
    return "Charging";
  }
  return "Surging";
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
  previousXpByNode,
}: {
  node: SkillNode;
  minutes: number;
  activityTypeId: ActivityTypeId;
  previousXpByNode: Record<string, number>;
}): {
  session: SessionLog;
  xpByNode: Record<string, number>;
} {
  const activityType = ACTIVITY_TYPES.find(
    (item) => item.id === activityTypeId
  ) ?? ACTIVITY_TYPES[1];
  const grantedXp = Math.round(minutes * activityType.multiplier);
  const nextXp = (previousXpByNode[node.id] ?? 0) + grantedXp;
  const xpByNode = {
    ...previousXpByNode,
    [node.id]: nextXp,
  };

  const state = getNodeState(node, xpByNode);

  return {
    xpByNode,
    session: {
      id: `${node.id}-${Date.now()}`,
      nodeId: node.id,
      nodeName: node.name,
      minutes,
      activityTypeId,
      activityLabel: activityType.label,
      grantedXp,
      feedback:
        state === "COMPLETED"
          ? "Milestone sealed. The node now radiates at full intensity."
          : "Progress registered. Node glow has increased.",
    },
  };
}

export function derivePathSignal(
  pathId: PathId,
  xpByNode: Record<string, number>
) {
  const nodes = ATHLETICS_TREE.filter((node) => node.pathId === pathId);

  if (nodes.length === 0) {
    return {
      completionText: "Signal dormant",
      signalBars: 1,
      glowStrength: 0.12,
      activeNodes: 0,
    };
  }

  const completedNodes = nodes.filter(
    (node) => getNodeState(node, xpByNode) === "COMPLETED"
  ).length;
  const activeNodes = nodes.filter(
    (node) => (xpByNode[node.id] ?? 0) > 0
  ).length;
  const averageCharge =
    nodes.reduce((sum, node) => sum + getNodeCharge(node, xpByNode), 0) /
    nodes.length;

  return {
    completionText:
      completedNodes > 0
        ? `${completedNodes}/${nodes.length} milestones stabilized`
        : activeNodes > 0
          ? "Progress signal rising"
          : "Signal dormant",
    signalBars: Math.max(1, Math.ceil(averageCharge * 4)),
    glowStrength: averageCharge,
    activeNodes,
  };
}
