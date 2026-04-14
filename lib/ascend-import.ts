import { type NodeType } from "@/lib/ascend-data";

export type ImportedNodeDraft = {
  id: string;
  title: string;
  branch: string;
  description: string;
  quests: string[];
  milestones: string[];
  nodeType: NodeType;
  capstoneGoal?: string;
  intendedOutcome?: string;
  demonstrationTitle?: string;
  demonstrationDescription?: string;
  sequenceLabel?: string;
  prerequisiteIds: string[];
};

export type ImportParseResult = {
  nodes: ImportedNodeDraft[];
  warnings: string[];
};

type ImportedNodeWorkingDraft = ImportedNodeDraft & {
  sourceOrder: number;
};

type ParseOptions = {
  defaultBranch?: string;
};

type SectionKey =
  | "description"
  | "quests"
  | "milestones"
  | "capstone"
  | "branch"
  | "type"
  | "outcome";

type ParsedNodeBlock = {
  title: string;
  sequenceLabel?: string;
  sections: Record<SectionKey, string[]>;
  sourceOrder: number;
};

type SequenceInfo = {
  numbers: number[];
  rootKey: string;
};

const NODE_HEADER_PATTERN = /^(?:[^\p{L}\p{N}]*)?node(?:\s+([A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*))?(?:\s*[-:|]\s*(.+))?$/iu;

const SECTION_LABELS: Record<SectionKey, string[]> = {
  description: ["skill goal", "goal", "description", "overview", "focus"],
  quests: ["quests", "quest", "tasks", "actions", "drills"],
  milestones: ["milestones", "milestone", "checkpoints", "wins", "markers"],
  capstone: ["node capstone", "capstone", "final proof", "proof", "project"],
  branch: ["branch", "track", "lane", "group"],
  type: ["type", "node type"],
  outcome: ["outcome", "intended outcome", "result"],
};

function createEmptySections(): Record<SectionKey, string[]> {
  return {
    description: [],
    quests: [],
    milestones: [],
    capstone: [],
    branch: [],
    type: [],
    outcome: [],
  };
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `import-${Date.now()}`
  );
}

function cleanLine(value: string) {
  return value.replace(/\r/g, "").replace(/[\u2013\u2014]/g, "-").trim();
}

function normalizeHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripListPrefix(value: string) {
  return value.replace(/^(?:[-*•]+|\d+[.)]?|\p{Extended_Pictographic}+)\s*/u, "").trim();
}

function splitList(lines: string[]) {
  return lines
    .flatMap((line) => line.split(/\s*[;•]\s*/))
    .map(stripListPrefix)
    .map((line) => line.replace(/^["“”]|["“”]$/g, "").trim())
    .filter(Boolean);
}

function matchSection(line: string): SectionKey | null {
  const heading = normalizeHeading(line);

  for (const [key, labels] of Object.entries(SECTION_LABELS) as Array<[SectionKey, string[]]>) {
    if (labels.includes(heading)) {
      return key;
    }
  }

  return null;
}

function parseSequence(sequenceLabel?: string): SequenceInfo | null {
  if (!sequenceLabel) {
    return null;
  }

  const numbers = sequenceLabel
    .split(".")
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part));

  if (numbers.length === 0) {
    return null;
  }

  return {
    numbers,
    rootKey: numbers.length > 1 ? String(numbers[0]) : sequenceLabel,
  };
}

function compareSequence(a?: string, b?: string) {
  const parsedA = parseSequence(a);
  const parsedB = parseSequence(b);

  if (!parsedA || !parsedB) {
    return 0;
  }

  const length = Math.max(parsedA.numbers.length, parsedB.numbers.length);
  for (let index = 0; index < length; index += 1) {
    const left = parsedA.numbers[index] ?? -1;
    const right = parsedB.numbers[index] ?? -1;
    if (left !== right) {
      return left - right;
    }
  }

  return 0;
}

function inferNodeType(block: ParsedNodeBlock, title: string) {
  const explicitType = block.sections.type.join(" ").toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (explicitType.includes("capstone") || lowerTitle.includes("capstone")) {
    return "capstone" satisfies NodeType;
  }
  if (
    explicitType.includes("foundation") ||
    /(foundation|fundamentals|baseline|base layer|basics)/i.test(lowerTitle)
  ) {
    return "foundation" satisfies NodeType;
  }

  return "skill" satisfies NodeType;
}

function parseBlocks(rawText: string) {
  const lines = rawText
    .split("\n")
    .map(cleanLine)
    .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1].length > 0));
  const blocks: ParsedNodeBlock[] = [];
  let current: ParsedNodeBlock | null = null;
  let currentSection: SectionKey | null = null;

  const commitCurrent = () => {
    if (current && (current.title || Object.values(current.sections).some((items) => items.length > 0))) {
      blocks.push(current);
    }
  };

  lines.forEach((line, sourceOrder) => {
    const headerMatch = line.match(NODE_HEADER_PATTERN);
    if (headerMatch) {
      commitCurrent();
      current = {
        title: cleanLine(headerMatch[2] ?? ""),
        sequenceLabel: cleanLine(headerMatch[1] ?? "") || undefined,
        sections: createEmptySections(),
        sourceOrder,
      };
      currentSection = null;
      return;
    }

    if (!current) {
      current = {
        title: "",
        sections: createEmptySections(),
        sourceOrder,
      };
    }

    const section = matchSection(line);
    if (section) {
      currentSection = section;
      return;
    }

    if (!current.title) {
      current.title = stripListPrefix(line);
      return;
    }

    if (currentSection) {
      current.sections[currentSection].push(line);
      return;
    }

    current.sections.description.push(line);
  });

  commitCurrent();
  return blocks;
}

function extractCapstone(lines: string[]) {
  const parts = splitList(lines);
  if (parts.length === 0) {
    return {
      capstoneGoal: undefined,
      demonstrationTitle: undefined,
      demonstrationDescription: undefined,
    };
  }

  return {
    capstoneGoal: parts[0],
    demonstrationTitle: parts[0],
    demonstrationDescription: parts.slice(1).join(" ") || parts[0],
  };
}

export function parseNodeBlueprint(rawText: string, options: ParseOptions = {}): ImportParseResult {
  const blocks = parseBlocks(rawText);

  if (blocks.length === 0) {
    return {
      nodes: [],
      warnings: ["No recognizable node content found. Paste at least a title or a NODE header."],
    };
  }

  const warnings: string[] = [];
  const nodes: ImportedNodeWorkingDraft[] = blocks.map((block, index) => {
    const title = block.title || `Imported Node ${index + 1}`;
    const quests = splitList(block.sections.quests);
    const milestones = splitList(block.sections.milestones);
    const description = block.sections.description.join(" ").trim();
    const intendedOutcome = block.sections.outcome.join(" ").trim() || undefined;
    const capstone = extractCapstone(block.sections.capstone);
    const branchFromText = block.sections.branch.join(" ").trim();
    const sequenceInfo = parseSequence(block.sequenceLabel);
    const branch =
      branchFromText ||
      options.defaultBranch ||
      (sequenceInfo && sequenceInfo.rootKey !== block.sequenceLabel ? `Branch ${sequenceInfo.rootKey}` : "") ||
      "Imported Branch";

    if (!description) {
      warnings.push(`"${title}" imported without a skill goal/description.`);
    }

    return {
      id: `${slugify(title)}-${index + 1}`,
      title,
      branch,
      description,
      quests,
      milestones,
      nodeType: inferNodeType(block, title),
      capstoneGoal: capstone.capstoneGoal,
      intendedOutcome,
      demonstrationTitle: capstone.demonstrationTitle,
      demonstrationDescription: capstone.demonstrationDescription,
      sequenceLabel: block.sequenceLabel,
      prerequisiteIds: [] as string[],
      sourceOrder: block.sourceOrder,
    };
  });

  const nodesByGroup = new Map<string, typeof nodes>();
  nodes.forEach((node) => {
    const sequence = parseSequence(node.sequenceLabel);
    const key = `${node.branch}::${sequence?.rootKey ?? "none"}`;
    nodesByGroup.set(key, [...(nodesByGroup.get(key) ?? []), node]);
  });

  nodesByGroup.forEach((groupNodes) => {
    const ordered = [...groupNodes].sort((left, right) => {
      const sequenceDelta = compareSequence(left.sequenceLabel, right.sequenceLabel);
      if (sequenceDelta !== 0) {
        return sequenceDelta;
      }
      return left.sourceOrder - right.sourceOrder;
    });

    let previousNonCapstone: (typeof ordered)[number] | null = null;

    ordered.forEach((node) => {
      if (node.nodeType === "capstone") {
        const priorNodes = ordered.filter(
          (candidate) => candidate.id !== node.id && candidate.nodeType !== "capstone"
        );
        if (priorNodes.length > 0) {
          node.prerequisiteIds = priorNodes.map((candidate) => candidate.id);
        }
        return;
      }

      if (
        previousNonCapstone &&
        previousNonCapstone.sequenceLabel &&
        node.sequenceLabel &&
        compareSequence(previousNonCapstone.sequenceLabel, node.sequenceLabel) < 0
      ) {
        node.prerequisiteIds = [previousNonCapstone.id];
      }
      previousNonCapstone = node;
    });
  });

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      title: node.title,
      branch: node.branch,
      description: node.description,
      quests: node.quests,
      milestones: node.milestones,
      nodeType: node.nodeType,
      capstoneGoal: node.capstoneGoal,
      intendedOutcome: node.intendedOutcome,
      demonstrationTitle: node.demonstrationTitle,
      demonstrationDescription: node.demonstrationDescription,
      sequenceLabel: node.sequenceLabel,
      prerequisiteIds: node.prerequisiteIds,
    })),
    warnings: Array.from(new Set(warnings)),
  };
}
