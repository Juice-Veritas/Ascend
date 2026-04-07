export type PathId =
  | "athletics"
  | "mandarin"
  | "geopolitics"
  | "science-tech"
  | "philosophy";

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
};

export const PATHS: PathDefinition[] = [
  {
    id: "athletics",
    name: "Athletics",
    kicker: "Body Protocol",
    summary: "Strength, endurance, mobility, and body control translated into visible signal.",
  },
  {
    id: "mandarin",
    name: "Mandarin",
    kicker: "Language Grid",
    summary: "Speech, comprehension, and character recall staged for later expansion.",
  },
  {
    id: "geopolitics",
    name: "Geopolitics",
    kicker: "World Intel",
    summary: "Regional context, statecraft, and strategic reading held in reserve.",
  },
  {
    id: "science-tech",
    name: "Science & Tech",
    kicker: "Research Stack",
    summary: "Technical depth, experimentation, and systems literacy queued for future trees.",
  },
  {
    id: "philosophy",
    name: "Philosophy",
    kicker: "Thought Forge",
    summary: "Reasoning, ethics, and deep reading configured as dormant pathways.",
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
    branch: "Core",
    description: "Baseline capacity across mobility, posture, recovery, and repeatable effort.",
    position: { x: 50, y: 54 },
    requirements: [],
    targetXp: 90,
  },
  {
    id: "muscle-up",
    pathId: "athletics",
    name: "Muscle-Up",
    branch: "Upper Body",
    description: "Explosive pulling strength and transition control.",
    position: { x: 78, y: 22 },
    requirements: ["physical-foundation"],
    targetXp: 140,
  },
  {
    id: "handstand",
    pathId: "athletics",
    name: "Handstand",
    branch: "Balance",
    description: "Inverted balance, shoulder stacking, and body-line control.",
    position: { x: 26, y: 22 },
    requirements: ["physical-foundation"],
    targetXp: 110,
  },
  {
    id: "handstand-pushup",
    pathId: "athletics",
    name: "Handstand Pushup",
    branch: "Balance",
    description: "Pressing strength layered onto stable inversion.",
    position: { x: 20, y: 10 },
    requirements: ["handstand"],
    targetXp: 150,
  },
  {
    id: "pistol-squat",
    pathId: "athletics",
    name: "Pistol Squat",
    branch: "Lower Body",
    description: "Single-leg strength, range, and control under load.",
    position: { x: 18, y: 78 },
    requirements: ["physical-foundation"],
    targetXp: 120,
  },
  {
    id: "half-marathon",
    pathId: "athletics",
    name: "Half Marathon",
    branch: "Endurance",
    description: "Sustainable aerobic engine and race-ready discipline.",
    position: { x: 82, y: 78 },
    requirements: ["physical-foundation"],
    targetXp: 160,
  },
  {
    id: "planche",
    pathId: "athletics",
    name: "Planche",
    branch: "Static Strength",
    description: "Maximal straight-arm strength and body tension.",
    position: { x: 54, y: 10 },
    requirements: ["physical-foundation"],
    targetXp: 180,
  },
  {
    id: "mobility",
    pathId: "athletics",
    name: "Splits",
    branch: "Mobility",
    description: "Open range in hips and hamstrings with repeatable control.",
    position: { x: 72, y: 62 },
    requirements: ["physical-foundation"],
    targetXp: 100,
  },
  {
    id: "body-composition",
    pathId: "athletics",
    name: "Physique Optimization",
    branch: "Composition",
    description: "Body composition aligned with energy, consistency, and appearance goals.",
    position: { x: 30, y: 64 },
    requirements: ["physical-foundation"],
    targetXp: 130,
  },
];
