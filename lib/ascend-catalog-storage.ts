import {
  DEFAULT_CATALOG,
  type EvidenceFields,
  type Milestone,
  type NodeType,
  type PathDefinition,
  type SkillNode,
  type TreeCatalog,
} from "@/lib/ascend-data";
import { createStructuredTreeLayout } from "@/lib/ascend-layout";

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
      skillTrees: Object.fromEntries(
        Object.entries({
          ...DEFAULT_CATALOG.skillTrees,
          ...(parsed.skillTrees ?? {}),
        }).map(([pathId, nodes]) => [pathId, (nodes ?? []).map(normalizeNode)])
      ),
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
  const generatedNodes = normalizedCapstones.flatMap((capstoneName, index) => {
    const branchSlug = capstoneName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const laneStep = normalizedCapstones.length === 1 ? 0 : 58 / Math.max(1, normalizedCapstones.length - 1);
    const laneX = Math.round(21 + index * laneStep);
    const foundationId = `${branchSlug}-foundation`;
    const skillId = `${branchSlug}-practice`;
    const capstoneId = `${branchSlug}-capstone`;

    const nodes: SkillNode[] = [
      createNode({
        id: foundationId,
        pathId,
        title: `${capstoneName} Foundation`,
        branch: capstoneName,
        description: `Base conditioning and prerequisites for ${capstoneName}.`,
        position: { x: laneX, y: 62 },
        prerequisites: [],
        nodeType: "foundation",
        milestones: [
          createCheckboxMilestone(
            `${foundationId}-scope`,
            "Define the baseline",
            `Clarify the base capacity needed before chasing ${capstoneName}.`
          ),
          createCheckboxMilestone(
            `${foundationId}-reps`,
            "Repeat the basics",
            "Complete enough repetitions or study blocks to stabilize the base."
          ),
        ],
        demonstrationTitle: `Show readiness for ${capstoneName}`,
        demonstrationDescription: "Demonstrate that the base work is repeatable in real conditions.",
        suggestions: [
          "Establish the minimum strength or knowledge base.",
          "Train consistently before increasing complexity.",
        ],
      }),
      createNode({
        id: skillId,
        pathId,
        title: `${capstoneName} Practice`,
        branch: capstoneName,
        description: `Direct practice block for progressing toward ${capstoneName}.`,
        position: { x: laneX, y: 42 },
        prerequisites: [foundationId],
        nodeType: "skill",
        milestones: [
          createCheckboxMilestone(
            `${skillId}-drill`,
            "Choose a repeatable drill",
            `Pick one drill or assignment that clearly advances ${capstoneName}.`
          ),
          createCheckboxMilestone(
            `${skillId}-evidence`,
            "Capture evidence",
            "Keep a note, clip, or artifact that shows the work is moving."
          ),
        ],
        demonstrationTitle: `Show working progress toward ${capstoneName}`,
        demonstrationDescription: "Demonstrate progress that is visible and hard to fake.",
        suggestions: [
          "Schedule short repeated practice blocks.",
          "Use one measurable drill each week.",
        ],
      }),
      createNode({
        id: capstoneId,
        pathId,
        title: capstoneName,
        branch: "Capstone",
        description: `Capstone outcome for the ${capstoneName} track.`,
        position: { x: laneX, y: 16 },
        prerequisites: [skillId],
        nodeType: "capstone",
        milestones: [
          createCheckboxMilestone(
            `${capstoneId}-plan`,
            "Define the standard",
            `Write down what counts as success for ${capstoneName}.`
          ),
        ],
        demonstrationTitle: `Demonstrate ${capstoneName}`,
        demonstrationDescription: "Show the full skill or prototype in a meaningful way.",
        suggestions: [
          "Practice the full skill in low-friction conditions.",
          "Keep prerequisite work in the rotation while chasing the goal.",
        ],
      }),
    ];

    return nodes;
  });

  return createStructuredTreeLayout(generatedNodes);
}

function createCheckboxMilestone(id: string, title: string, description: string): Milestone {
  return {
    id,
    title,
    description,
    progressType: "checkbox",
    completed: false,
  };
}

function normalizeEvidence(evidence: unknown): EvidenceFields | undefined {
  if (!evidence || typeof evidence !== "object") {
    return undefined;
  }

  const candidate = evidence as Partial<EvidenceFields>;
  const attachments = Array.isArray(candidate.attachments)
    ? candidate.attachments
        .filter((item) => item && typeof item === "object")
        .map((item, index) => ({
          id: String(item.id ?? `attachment-${index}`),
          label: String(item.label ?? "Attachment placeholder"),
          kind: (item.kind === "image" ? "image" : "file") as "image" | "file",
          status: "placeholder" as const,
        }))
    : undefined;

  return {
    note: typeof candidate.note === "string" ? candidate.note : undefined,
    link: typeof candidate.link === "string" ? candidate.link : undefined,
    proofText: typeof candidate.proofText === "string" ? candidate.proofText : undefined,
    attachments,
  };
}

function createNode({
  id,
  pathId,
  title,
  branch,
  description,
  position,
  prerequisites,
  nodeType,
  milestones,
  demonstrationTitle,
  demonstrationDescription,
  suggestions,
}: {
  id: string;
  pathId: string;
  title: string;
  branch: string;
  description: string;
  position: { x: number; y: number };
  prerequisites: string[];
  nodeType: NodeType;
  milestones: Milestone[];
  demonstrationTitle: string;
  demonstrationDescription: string;
  suggestions: string[];
}): SkillNode {
  return {
    id,
    pathId,
    title,
    branch,
    description,
    position,
    prerequisites,
    nodeType,
    milestones,
    demonstration: {
      title: demonstrationTitle,
      description: demonstrationDescription,
      completed: false,
    },
    suggestions,
  };
}

function normalizeNode(node: Partial<SkillNode> & Record<string, unknown>): SkillNode {
  const title =
    typeof node.title === "string"
      ? node.title
      : typeof node.name === "string"
        ? node.name
        : "Untitled Node";
  const nodeType =
    node.nodeType === "foundation" || node.nodeType === "skill" || node.nodeType === "capstone"
      ? node.nodeType
      : node.kind === "foundation" || node.kind === "skill" || node.kind === "capstone"
        ? node.kind
        : "skill";

  return {
    id: String(node.id ?? `node-${Date.now()}`),
    pathId: String(node.pathId ?? "athletics"),
    title,
    branch: String(node.branch ?? "Custom"),
    description: String(node.description ?? ""),
    position: {
      x: typeof node.position?.x === "number" ? node.position.x : 50,
      y: typeof node.position?.y === "number" ? node.position.y : 50,
    },
    prerequisites: Array.isArray(node.prerequisites)
      ? node.prerequisites.map(String)
      : Array.isArray(node.requirements)
        ? node.requirements.map(String)
        : [],
    nodeType,
    milestones: Array.isArray(node.milestones)
      ? node.milestones.map((milestone, index) => ({
          id: String(milestone.id ?? `${title}-${index}`),
          title: String(milestone.title ?? `Milestone ${index + 1}`),
          description: String(milestone.description ?? ""),
          progressType:
            milestone.progressType === "checkbox" ||
            milestone.progressType === "numeric" ||
            milestone.progressType === "demonstration" ||
            milestone.progressType === "custom"
              ? milestone.progressType
              : "checkbox",
          targetValue:
            typeof milestone.targetValue === "number" ? milestone.targetValue : undefined,
          currentValue:
            typeof milestone.currentValue === "number" ? milestone.currentValue : undefined,
          completed: Boolean(milestone.completed),
          notes: typeof milestone.notes === "string" ? milestone.notes : undefined,
          required:
            typeof milestone.required === "boolean" ? milestone.required : undefined,
          completedAt:
            typeof milestone.completedAt === "string" ? milestone.completedAt : undefined,
          evidence: normalizeEvidence(milestone.evidence),
        }))
      : [
          {
            id: `${title}-starter`,
            title: "Define the first milestone",
            description: "This node was migrated from the legacy XP system.",
            progressType: "checkbox",
            completed: false,
          },
        ],
    demonstration: {
      title:
        typeof node.demonstration?.title === "string"
          ? node.demonstration.title
          : `Demonstrate ${title}`,
      description:
        typeof node.demonstration?.description === "string"
          ? node.demonstration.description
          : "Show the skill or prototype in a meaningful way.",
      completed: Boolean(node.demonstration?.completed),
      notes:
        typeof node.demonstration?.notes === "string"
          ? node.demonstration.notes
          : undefined,
      completedAt:
        typeof node.demonstration?.completedAt === "string"
          ? node.demonstration.completedAt
          : undefined,
      evidence: normalizeEvidence(node.demonstration?.evidence),
    },
    demonstrationBypassesMilestones: Boolean(node.demonstrationBypassesMilestones),
    suggestions: Array.isArray(node.suggestions) ? node.suggestions.map(String) : [],
    capstoneGoal: typeof node.capstoneGoal === "string" ? node.capstoneGoal : undefined,
    intendedOutcome:
      typeof node.intendedOutcome === "string" ? node.intendedOutcome : undefined,
  };
}
