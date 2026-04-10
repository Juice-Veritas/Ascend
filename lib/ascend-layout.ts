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

  const branchNames = Array.from(
    new Set(tree.filter((node) => node.nodeType !== "capstone").map((node) => node.branch))
  );
  const laneStep = branchNames.length <= 1 ? 0 : 60 / Math.max(1, branchNames.length - 1);
  const branchCenters = new Map(
    branchNames.map((branch, index) => [branch, 20 + index * laneStep])
  );

  const capstones = tree.filter((node) => node.nodeType === "capstone");
  const capstoneStep = capstones.length <= 1 ? 0 : 60 / Math.max(1, capstones.length - 1);

  const laidOut = tree.map((node) => {
    if (node.nodeType === "capstone") {
      const capstoneIndex = capstones.findIndex((item) => item.id === node.id);
      return {
        ...node,
        position: normalizeNodePosition(
          {
            x: 20 + capstoneIndex * capstoneStep,
            y: 18,
          },
          node.nodeType
        ),
      };
    }

    const branchX = branchCenters.get(node.branch) ?? 50;
    const fallbackY = node.nodeType === "foundation" ? 70 : 48;

    if (node.prerequisites.length > 0) {
      const parents = tree.filter((item) => node.prerequisites.includes(item.id));
      const averageParentX =
        parents.length > 0
          ? parents.reduce((sum, item) => sum + item.position.x, 0) / parents.length
          : branchX;

      return {
        ...node,
        position: normalizeNodePosition(
          {
            x: Math.round((averageParentX + branchX) / 2),
            y: fallbackY,
          },
          node.nodeType
        ),
      };
    }

    return {
      ...node,
      position: normalizeNodePosition({ x: branchX, y: fallbackY }, node.nodeType),
    };
  });

  return laidOut.map((node) => ({
    ...node,
    position: findOpenNodePosition(node.position, node, laidOut),
  }));
}
