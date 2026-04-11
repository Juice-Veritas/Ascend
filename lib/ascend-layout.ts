import { type NodeType, type SkillNode } from "@/lib/ascend-data";

export const MAP_BOUNDS = {
  minX: 12,
  maxX: 88,
  minY: 12,
  maxY: 82,
} as const;

export const MAP_GRID_STEP = 2;
export const MIN_NODE_SPACING = {
  x: 10,
  y: 8,
} as const;

const NODE_BANDS: Record<NodeType, { minY: number; maxY: number }> = {
  capstone: { minY: 12, maxY: 26 },
  skill: { minY: 34, maxY: 60 },
  foundation: { minY: 62, maxY: 80 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number) {
  return Math.round(value / MAP_GRID_STEP) * MAP_GRID_STEP;
}

function overlaps(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) < MIN_NODE_SPACING.x && Math.abs(a.y - b.y) < MIN_NODE_SPACING.y;
}

export function normalizeNodePosition(
  position: { x: number; y: number },
  nodeType: NodeType
) {
  const band = NODE_BANDS[nodeType];

  return {
    x: clamp(snap(position.x), MAP_BOUNDS.minX, MAP_BOUNDS.maxX),
    y: clamp(snap(position.y), band.minY, band.maxY),
  };
}

export function findOpenNodePosition(
  nextPosition: { x: number; y: number },
  node: SkillNode,
  nodes: SkillNode[]
) {
  const normalized = normalizeNodePosition(nextPosition, node.nodeType);
  const occupied = nodes.filter((item) => item.id !== node.id);

  if (!occupied.some((item) => overlaps(normalized, item.position))) {
    return normalized;
  }

  for (let radius = 1; radius <= 10; radius += 1) {
    const offsets = [
      { x: radius, y: 0 },
      { x: -radius, y: 0 },
      { x: 0, y: radius },
      { x: 0, y: -radius },
      { x: radius, y: radius },
      { x: -radius, y: radius },
      { x: radius, y: -radius },
      { x: -radius, y: -radius },
    ];

    for (const offset of offsets) {
      const candidate = normalizeNodePosition(
        {
          x: normalized.x + offset.x * MAP_GRID_STEP,
          y: normalized.y + offset.y * MAP_GRID_STEP,
        },
        node.nodeType
      );

      if (!occupied.some((item) => overlaps(candidate, item.position))) {
        return candidate;
      }
    }
  }

  return normalized;
}

export function createStructuredTreeLayout(tree: SkillNode[]) {
  if (tree.length === 0) {
    return tree;
  }

  const byId = new Map(tree.map((node) => [node.id, node]));
  const depthCache = new Map<string, number>();
  const getDepth = (node: SkillNode): number => {
    const cached = depthCache.get(node.id);
    if (cached !== undefined) {
      return cached;
    }

    if (node.nodeType === "foundation" || node.prerequisites.length === 0) {
      depthCache.set(node.id, 0);
      return 0;
    }

    const parentDepth = Math.max(
      ...node.prerequisites
        .map((id) => byId.get(id))
        .filter((value): value is SkillNode => Boolean(value))
        .map((parent) => getDepth(parent))
    );

    const nextDepth = parentDepth + 1;
    depthCache.set(node.id, nextDepth);
    return nextDepth;
  };

  const branchNames = Array.from(new Set(tree.filter((node) => node.nodeType !== "capstone").map((node) => node.branch)));
  const laneStep = branchNames.length <= 1 ? 0 : 64 / Math.max(1, branchNames.length - 1);
  const branchCenters = new Map(branchNames.map((branch, index) => [branch, 18 + index * laneStep]));

  const skillDepths = tree.filter((node) => node.nodeType === "skill").map((node) => getDepth(node));
  const maxSkillDepth = Math.max(1, ...skillDepths);

  const groups = new Map<string, SkillNode[]>();
  for (const node of tree.filter((item) => item.nodeType !== "capstone")) {
    const level = node.nodeType === "foundation" ? 0 : getDepth(node);
    const key = `${node.branch}:${level}:${node.nodeType}`;
    groups.set(key, [...(groups.get(key) ?? []), node]);
  }

  const laidOut = tree.filter((item) => item.nodeType !== "capstone").map((node) => {
    if (node.nodeType === "capstone") {
      return node;
    }

    const level = node.nodeType === "foundation" ? 0 : getDepth(node);
    const siblings = groups.get(`${node.branch}:${level}:${node.nodeType}`) ?? [node];
    const siblingIndex = siblings.findIndex((item) => item.id === node.id);
    const siblingOffset = (siblingIndex - (siblings.length - 1) / 2) * 7;
    const branchCenter = branchCenters.get(node.branch) ?? 50;
    const parents = node.prerequisites.map((id) => byId.get(id)).filter((value): value is SkillNode => Boolean(value));
    const parentAverageX = parents.length > 0 ? parents.reduce((sum, parent) => sum + parent.position.x, 0) / parents.length : branchCenter;

    const baseX = node.nodeType === "foundation" ? branchCenter : Math.round((branchCenter * 0.6 + parentAverageX * 0.4));
    const skillY = maxSkillDepth <= 1 ? 48 : 58 - ((level - 1) / Math.max(1, maxSkillDepth - 1)) * 18;

    return {
      ...node,
      position: normalizeNodePosition(
        {
          x: baseX + siblingOffset,
          y: node.nodeType === "foundation" ? 72 : skillY,
        },
        node.nodeType
      ),
    };
  });

  const capstones = tree
    .filter((node) => node.nodeType === "capstone")
    .map((node) => {
      const parents = node.prerequisites.map((id) => byId.get(id)).filter((value): value is SkillNode => Boolean(value));
      const averageParentX = parents.length > 0 ? parents.reduce((sum, parent) => sum + parent.position.x, 0) / parents.length : 50;
      return { node, averageParentX };
    })
    .sort((a, b) => a.averageParentX - b.averageParentX);

  capstones.forEach(({ node, averageParentX }, index) => {
    const fallbackStep = capstones.length <= 1 ? 0 : 62 / Math.max(1, capstones.length - 1);
    const fallbackX = 19 + index * fallbackStep;
    const nextPosition = normalizeNodePosition({ x: averageParentX || fallbackX, y: 16 }, node.nodeType);
    laidOut.push({ ...node, position: nextPosition });
  });

  return laidOut.map((node) => ({
    ...node,
    position: findOpenNodePosition(node.position, node, laidOut),
  }));
}
