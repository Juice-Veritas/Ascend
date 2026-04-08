export type PathId = string;

export type NodeState = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";

export type ActivityTypeId =
  | "passive"
  | "standard"
  | "focused"
  | "deep-work"
  | "output"
  | "high-effort";

export type PathDefinition = {
  id: PathId;
  name: string;
  kicker: string;
  summary: string;
  overview: string;
  accent: string;
  orbit: { x: number; y: number };
};

export type SkillNode = {
  id: string;
  pathId: PathId;
  name: string;
  branch: string;
  description: string;
  position: { x: number; y: number };
  requirements: string[];
  targetXp: number;
  kind: "foundation" | "skill" | "capstone";
  suggestions: string[];
};

export type SessionLog = {
  id: string;
  nodeId: string;
  nodeName: string;
  minutes: number;
  activityTypeId: ActivityTypeId;
  activityLabel: string;
  grantedXp: number;
  feedback: string;
  note?: string;
};

export type TreeCatalog = {
  paths: PathDefinition[];
  skillTrees: Record<PathId, SkillNode[]>;
};

export const PATHS: PathDefinition[] = [
  {
    id: "athletics",
    name: "Athletics",
    kicker: "Body Protocol",
    summary: "Strength, endurance, mobility, and body control translated into visible signal.",
    overview:
      "Build a physically capable base, then branch into capstones like handstand, muscle-up, planche, splits, and half marathon readiness.",
    accent: "from-cyan-300 via-cyan-200 to-fuchsia-300",
    orbit: { x: 66, y: 38 },
  },
  {
    id: "mandarin",
    name: "Mandarin",
    kicker: "Language Grid",
    summary: "Speech, comprehension, and character recall staged for immersion.",
    overview:
      "A living language tree built around speaking confidence, listening fluency, reading, and long-term recall.",
    accent: "from-amber-300 via-orange-200 to-cyan-300",
    orbit: { x: 48, y: 18 },
  },
  {
    id: "philosophy",
    name: "Philosophy",
    kicker: "Thought Forge",
    summary: "Reasoning, ethics, and deep reading tracked as identity work.",
    overview:
      "Structure philosophical study around major traditions, clear writing, and arguments you can actually articulate.",
    accent: "from-fuchsia-300 via-pink-200 to-cyan-200",
    orbit: { x: 28, y: 34 },
  },
  {
    id: "science-tech",
    name: "Science & Tech",
    kicker: "Research Stack",
    summary: "Technical depth, experimentation, and systems literacy in one lane.",
    overview:
      "A hybrid tree for building technical leverage through coding, tooling fluency, experiments, and scientific reading.",
    accent: "from-cyan-300 via-sky-200 to-lime-200",
    orbit: { x: 32, y: 64 },
  },
  {
    id: "geopolitics",
    name: "Geopolitics",
    kicker: "World Intel",
    summary: "Regional context, statecraft, and strategic reading held in one map.",
    overview:
      "Track regions, institutions, and current events in a way that compounds instead of becoming disconnected trivia.",
    accent: "from-cyan-300 via-emerald-200 to-teal-200",
    orbit: { x: 58, y: 64 },
  },
];

export const ACTIVITY_TYPES = [
  {
    id: "passive",
    label: "Passive",
    multiplier: 0.8,
    description: "Light engagement and low strain.",
  },
  {
    id: "standard",
    label: "Standard",
    multiplier: 1,
    description: "Normal work with consistent pace.",
  },
  {
    id: "focused",
    label: "Focused",
    multiplier: 1.25,
    description: "Structured practice with intent.",
  },
  {
    id: "deep-work",
    label: "Deep Work",
    multiplier: 1.5,
    description: "High focus with low distraction.",
  },
  {
    id: "output",
    label: "Output",
    multiplier: 1.75,
    description: "Visible creation or performance.",
  },
  {
    id: "high-effort",
    label: "High Effort",
    multiplier: 2,
    description: "Maximum intensity session.",
  },
] as const satisfies ReadonlyArray<{
  id: ActivityTypeId;
  label: string;
  multiplier: number;
  description: string;
}>;

export const ATHLETICS_TREE: SkillNode[] = [
  {
    id: "physical-foundation",
    pathId: "athletics",
    name: "Physical Foundation",
    branch: "Base Layer",
    description: "Baseline capacity across mobility, posture, recovery, and repeatable effort.",
    position: { x: 50, y: 58 },
    requirements: [],
    targetXp: 90,
    kind: "foundation",
    suggestions: [
      "Log foundational strength sessions three times this week.",
      "Use a simple mobility warmup before every workout block.",
      "Track recovery habits that keep training repeatable.",
    ],
  },
  {
    id: "vertical-push",
    pathId: "athletics",
    name: "Vertical Push",
    branch: "Calisthenics",
    description: "Shoulder pressing capacity and overhead stability for inversion work.",
    position: { x: 31, y: 47 },
    requirements: ["physical-foundation"],
    targetXp: 80,
    kind: "skill",
    suggestions: [
      "Accumulate pike pushups or wall-facing holds.",
      "Use tempo work to own shoulder range rather than rushing reps.",
      "Pair pressing with wrist prep for handstand work.",
    ],
  },
  {
    id: "vertical-pull",
    pathId: "athletics",
    name: "Vertical Pull",
    branch: "Calisthenics",
    description: "Pulling strength and scapular control that supports muscle-up progression.",
    position: { x: 46, y: 46 },
    requirements: ["physical-foundation"],
    targetXp: 80,
    kind: "skill",
    suggestions: [
      "Build strict pull-up volume before chasing transitions.",
      "Use false-grip hangs and scap pulls.",
      "Film a set to check bodyline and elbow path.",
    ],
  },
  {
    id: "mobility-base",
    pathId: "athletics",
    name: "Mobility Base",
    branch: "Flexibility",
    description: "Open hips, hamstrings, and shoulders enough to support deep positions safely.",
    position: { x: 66, y: 48 },
    requirements: ["physical-foundation"],
    targetXp: 70,
    kind: "skill",
    suggestions: [
      "Use a short daily mobility block instead of infrequent long sessions.",
      "Bias end-range holds after training when tissue is warm.",
      "Track one flexibility metric each week.",
    ],
  },
  {
    id: "aerobic-engine",
    pathId: "athletics",
    name: "Aerobic Engine",
    branch: "Endurance",
    description: "Sustainable easy mileage and recovery-friendly base conditioning.",
    position: { x: 81, y: 48 },
    requirements: ["physical-foundation"],
    targetXp: 85,
    kind: "skill",
    suggestions: [
      "Stack easy runs before adding speed work.",
      "Keep one session conversational to build volume.",
      "Use run-walk blocks if consistency matters more than pace.",
    ],
  },
  {
    id: "handstand",
    pathId: "athletics",
    name: "Handstand",
    branch: "Capstone",
    description: "Inverted balance, shoulder stacking, and body-line control.",
    position: { x: 25, y: 18 },
    requirements: ["vertical-push"],
    targetXp: 120,
    kind: "capstone",
    suggestions: [
      "Practice wall-facing line drills before freestanding attempts.",
      "Use short, frequent sets to build balance faster.",
      "Keep wrist prep and shoulder opening in the same session.",
    ],
  },
  {
    id: "muscle-up",
    pathId: "athletics",
    name: "Muscle-Up",
    branch: "Capstone",
    description: "Explosive pulling strength and clean transition mechanics.",
    position: { x: 43, y: 18 },
    requirements: ["vertical-pull"],
    targetXp: 140,
    kind: "capstone",
    suggestions: [
      "Build chest-to-bar height before transition drilling.",
      "Practice low-bar transitions for confidence.",
      "Use band assistance only to learn timing, not to mask weak pulling.",
    ],
  },
  {
    id: "splits",
    pathId: "athletics",
    name: "Splits",
    branch: "Capstone",
    description: "Open range in hips and hamstrings with repeatable control.",
    position: { x: 63, y: 18 },
    requirements: ["mobility-base"],
    targetXp: 100,
    kind: "capstone",
    suggestions: [
      "Prioritize consistency over depth-chasing.",
      "Use both active and passive flexibility work.",
      "Train hamstrings and hip flexors in the same plan.",
    ],
  },
  {
    id: "half-marathon",
    pathId: "athletics",
    name: "Half Marathon",
    branch: "Capstone",
    description: "Sustainable aerobic engine and race-ready discipline.",
    position: { x: 81, y: 18 },
    requirements: ["aerobic-engine"],
    targetXp: 160,
    kind: "capstone",
    suggestions: [
      "Progress weekly long runs slowly enough to stay healthy.",
      "Anchor training around recovery and sleep quality.",
      "Run by effort first, pace second.",
    ],
  },
];

export const DEFAULT_CATALOG: TreeCatalog = {
  paths: PATHS,
  skillTrees: {
    athletics: ATHLETICS_TREE,
    mandarin: [],
    philosophy: [],
    "science-tech": [],
    geopolitics: [],
  },
};
