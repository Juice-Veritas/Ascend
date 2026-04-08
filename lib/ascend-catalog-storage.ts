import {
  DEFAULT_CATALOG,
  type PathDefinition,
  type SkillNode,
  type TreeCatalog,
} from "@/lib/ascend-data";

const STORAGE_KEY = "ascend-catalog";

export function readTreeCatalog() {
  if (typeof window === "undefined") {
    return DEFAULT_CATALOG;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_CATALOG;
    }

    const parsed = JSON.parse(raw) as Partial<TreeCatalog>;
    return {
      paths: parsed.paths ?? DEFAULT_CATALOG.paths,
      skillTrees: {
        ...DEFAULT_CATALOG.skillTrees,
        ...(parsed.skillTrees ?? {}),
      },
    };
  } catch {
    return DEFAULT_CATALOG;
  }
}

export function writeTreeCatalog(catalog: TreeCatalog) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
}

export function createPathDefinition(name: string, index: number): PathDefinition {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `path-${Date.now()}`;
  const accents = [
    "from-cyan-300 via-sky-200 to-fuchsia-300",
    "from-lime-300 via-emerald-200 to-cyan-300",
    "from-amber-300 via-orange-200 to-fuchsia-300",
    "from-fuchsia-300 via-pink-200 to-cyan-200",
  ];

  return {
    id: slug,
    name,
    kicker: "Custom Tree",
    summary: "A manually defined path shaped around your current identity goals.",
    overview: `Custom progression map for ${name}. Add capstones, branches, and supporting nodes as needed.`,
    accent: accents[index % accents.length],
    orbit: {
      x: 24 + (index % 3) * 18,
      y: 24 + Math.floor(index / 3) * 18,
    },
  };
}

export function createGeneratedTree(pathId: string, capstoneNames: string[]) {
  const normalizedCapstones = capstoneNames.length > 0 ? capstoneNames : ["Primary Capstone"];

  return normalizedCapstones.flatMap((capstoneName, index) => {
    const branchSlug = capstoneName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const laneStep = normalizedCapstones.length === 1 ? 0 : 58 / Math.max(1, normalizedCapstones.length - 1);
    const laneX = Math.round(21 + index * laneStep);
    const foundationId = `${branchSlug}-foundation`;
    const skillId = `${branchSlug}-practice`;
    const capstoneId = `${branchSlug}-capstone`;

    const nodes: SkillNode[] = [
      {
        id: foundationId,
        pathId,
        name: `${capstoneName} Foundation`,
        branch: capstoneName,
        description: `Base conditioning and prerequisites for ${capstoneName}.`,
        position: { x: laneX, y: 62 },
        requirements: [],
        targetXp: 60,
        kind: "foundation",
        suggestions: [
          "Establish the minimum strength or knowledge base.",
          "Train consistently before increasing complexity.",
          "Track technique quality instead of only volume.",
        ],
      },
      {
        id: skillId,
        pathId,
        name: `${capstoneName} Practice`,
        branch: capstoneName,
        description: `Direct practice block for progressing toward ${capstoneName}.`,
        position: { x: laneX, y: 42 },
        requirements: [foundationId],
        targetXp: 90,
        kind: "skill",
        suggestions: [
          "Schedule short repeated practice blocks.",
          "Use one measurable drill each week.",
          "Review progress after each session and adjust.",
        ],
      },
      {
        id: capstoneId,
        pathId,
        name: capstoneName,
        branch: "Capstone",
        description: `Capstone outcome for the ${capstoneName} track.`,
        position: { x: laneX, y: 16 },
        requirements: [skillId],
        targetXp: 130,
        kind: "capstone",
        suggestions: [
          "Practice the full skill in low-friction conditions.",
          "Use review footage or notes to refine execution.",
          "Keep prerequisite work in the rotation while chasing the goal.",
        ],
      },
    ];

    return nodes;
  });
}
