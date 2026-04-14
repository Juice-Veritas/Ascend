export type PathId = string;

export type NodeState = "locked" | "available" | "in-progress" | "mastered";
export type NodeType = "foundation" | "skill" | "capstone";
export type MilestoneProgressType =
  | "checkbox"
  | "numeric"
  | "demonstration"
  | "custom";

export type EvidenceAttachmentPlaceholder = {
  id: string;
  label: string;
  kind: "image" | "file";
  status: "placeholder";
};

export type EvidenceFields = {
  note?: string;
  link?: string;
  proofText?: string;
  attachments?: EvidenceAttachmentPlaceholder[];
};

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

export type Milestone = {
  id: string;
  title: string;
  description: string;
  progressType: MilestoneProgressType;
  targetValue?: number;
  currentValue?: number;
  completed: boolean;
  notes?: string;
  required?: boolean;
  completedAt?: string;
  evidence?: EvidenceFields;
};

export type DemonstrationRequirement = {
  title: string;
  description: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
  evidence?: EvidenceFields;
};

export type SkillNode = {
  id: string;
  pathId: PathId;
  title: string;
  branch: string;
  description: string;
  quests?: string[];
  position: { x: number; y: number };
  prerequisites: string[];
  nodeType: NodeType;
  milestones: Milestone[];
  demonstration: DemonstrationRequirement;
  demonstrationBypassesMilestones?: boolean;
  suggestions: string[];
  intendedOutcome?: string;
  capstoneGoal?: string;
};

export type SessionLog = {
  id: string;
  nodeId: string;
  nodeTitle: string;
  minutes: number;
  activityTypeId: ActivityTypeId;
  activityLabel: string;
  note?: string;
  feedback: string;
  createdAt: string;
};

export type TreeCatalog = {
  paths: PathDefinition[];
  skillTrees: Record<PathId, SkillNode[]>;
};

function checkboxMilestone(
  id: string,
  title: string,
  description: string,
  notes?: string
): Milestone {
  return { id, title, description, progressType: "checkbox", completed: false, notes };
}

function numericMilestone(
  id: string,
  title: string,
  description: string,
  targetValue: number,
  currentValue = 0
): Milestone {
  return {
    id,
    title,
    description,
    progressType: "numeric",
    targetValue,
    currentValue,
    completed: currentValue >= targetValue,
  };
}

function proofMilestone(
  id: string,
  title: string,
  description: string
): Milestone {
  return {
    id,
    title,
    description,
    progressType: "demonstration",
    completed: false,
  };
}

export const PATHS: PathDefinition[] = [
  {
    id: "athletics",
    name: "Athletics",
    kicker: "Body Protocol",
    summary: "Milestone-led calisthenics and conditioning progression.",
    overview:
      "Build real physical capacity through foundations, measurable milestones, and meaningful demonstrations.",
    accent: "from-cyan-300 via-sky-200 to-fuchsia-300",
    orbit: { x: 66, y: 38 },
  },
  {
    id: "mandarin",
    name: "Mandarin",
    kicker: "Language Grid",
    summary: "Speech, listening, and retention milestones staged for immersion.",
    overview:
      "Shape a custom language path around lessons, speaking reps, recall, and live use.",
    accent: "from-amber-300 via-orange-200 to-cyan-300",
    orbit: { x: 48, y: 18 },
  },
  {
    id: "philosophy",
    name: "Philosophy",
    kicker: "Thought Forge",
    summary: "Reading, writing, and argument milestones that compound into clarity.",
    overview:
      "Build your own philosophy tree around traditions, texts, essays, and demonstrated understanding.",
    accent: "from-fuchsia-300 via-pink-200 to-cyan-200",
    orbit: { x: 28, y: 34 },
  },
  {
    id: "science-tech",
    name: "Science & Technology",
    kicker: "Prototype Stack",
    summary: "Research, experimentation, and prototype-building aimed at AR contact lenses.",
    overview:
      "Move from foundations to prototype outputs in optics, displays, embedded systems, fabrication, and test rigs.",
    accent: "from-cyan-300 via-sky-200 to-lime-200",
    orbit: { x: 32, y: 64 },
  },
  {
    id: "geopolitics",
    name: "Geopolitics",
    kicker: "World Intel",
    summary: "Regional context and strategic reading structured as living mastery paths.",
    overview:
      "Track regions, institutions, and current events without losing the map of what matters.",
    accent: "from-cyan-300 via-emerald-200 to-teal-200",
    orbit: { x: 58, y: 64 },
  },
];

export const ACTIVITY_TYPES = [
  {
    id: "passive",
    label: "Passive",
    description: "Light review, reading, or easy movement.",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Normal practice session with steady effort.",
  },
  {
    id: "focused",
    label: "Focused",
    description: "Structured work with clear intent.",
  },
  {
    id: "deep-work",
    label: "Deep Work",
    description: "Longer block with high concentration.",
  },
  {
    id: "output",
    label: "Output",
    description: "A session that produced something visible.",
  },
  {
    id: "high-effort",
    label: "High Effort",
    description: "Peak effort or difficult training block.",
  },
] as const satisfies ReadonlyArray<{
  id: ActivityTypeId;
  label: string;
  description: string;
}>;

export const ATHLETICS_TREE: SkillNode[] = [
  {
    id: "physical-foundation",
    pathId: "athletics",
    title: "Physical Foundation",
    branch: "Base Layer",
    description:
      "Baseline strength, mobility, and recovery habits that make harder work sustainable.",
    quests: [],
    position: { x: 50, y: 70 },
    prerequisites: [],
    nodeType: "foundation",
    milestones: [
      numericMilestone(
        "foundation-sessions",
        "Twelve foundational sessions",
        "Complete twelve repeatable full-body or movement-prep sessions.",
        12,
        5
      ),
      checkboxMilestone(
        "foundation-warmup",
        "Warm-up system locked in",
        "Define a short warm-up you can repeat before every athletic block."
      ),
      proofMilestone(
        "foundation-recovery",
        "Recovery review",
        "Document the recovery habits that keep training repeatable."
      ),
    ],
    demonstration: {
      title: "Show a sustainable base week",
      description: "Complete a week of training that feels strong, repeatable, and pain-managed.",
      completed: false,
    },
    suggestions: [
      "Keep this node honest by building routines you can repeat under normal life conditions.",
      "Foundations should reduce friction, not create more complexity.",
    ],
  },
  {
    id: "vertical-pull",
    pathId: "athletics",
    title: "Vertical Pull",
    branch: "Calisthenics",
    description:
      "Pulling strength and scapular control that build toward powerful, demonstrable upper-body pulling.",
    quests: [],
    position: { x: 40, y: 48 },
    prerequisites: ["physical-foundation"],
    nodeType: "skill",
    milestones: [
      numericMilestone(
        "vertical-pull-1",
        "10 strict pull-ups",
        "Hit ten strict, clean pull-ups with full range of motion.",
        10,
        6
      ),
      numericMilestone(
        "vertical-pull-2",
        "5 weighted pull-ups",
        "Complete five weighted pull-ups with controlled mechanics.",
        5
      ),
      numericMilestone(
        "vertical-pull-3",
        "8 chest-to-bar pull-ups",
        "Pull high enough to make chest-to-bar reps consistent.",
        8
      ),
      numericMilestone(
        "vertical-pull-4",
        "3 explosive pull-ups",
        "Demonstrate explosive pulling with visible height and speed.",
        3
      ),
    ],
    demonstration: {
      title: "Perform the Vertical Pull standard",
      description: "Show a confident set that proves this node standard is truly yours.",
      completed: false,
    },
    demonstrationBypassesMilestones: true,
    suggestions: [
      "Explosive pulling usually improves when strength and technique are trained together.",
      "If you already own this skill, use the demonstration to claim it directly.",
    ],
  },
  {
    id: "lower-body-control",
    pathId: "athletics",
    title: "Lower Body Control",
    branch: "Calisthenics",
    description:
      "Single-leg strength, balance, and mobility that support deep squat control and clean leg patterns.",
    quests: [],
    position: { x: 58, y: 48 },
    prerequisites: ["physical-foundation"],
    nodeType: "skill",
    milestones: [
      checkboxMilestone(
        "lower-body-1",
        "Ankle mobility standard",
        "Reach a stable ankle position that supports deep single-leg squatting."
      ),
      numericMilestone(
        "lower-body-2",
        "8 assisted pistol squats each side",
        "Use assistance only as needed to own depth and control.",
        8
      ),
      numericMilestone(
        "lower-body-3",
        "3 controlled pistols each side",
        "Complete three smooth pistol squats per side.",
        3
      ),
    ],
    demonstration: {
      title: "Demonstrate pistol squat proficiency",
      description: "Perform a clean pistol squat on each side with control and confidence.",
      completed: false,
    },
    demonstrationBypassesMilestones: true,
    suggestions: [
      "Balance issues usually trace back to ankle mobility, hip control, or rushing the descent.",
    ],
  },
  {
    id: "muscle-up",
    pathId: "athletics",
    title: "Muscle-Up",
    branch: "Capstone",
    description:
      "Explosive pulling, transition mechanics, and top support expressed as a clean, repeatable rep.",
    position: { x: 40, y: 18 },
    prerequisites: ["vertical-pull"],
    nodeType: "capstone",
    milestones: [
      checkboxMilestone(
        "muscle-up-1",
        "False-grip and transition practice",
        "Build comfort in the transition pattern with low-friction drills."
      ),
      proofMilestone(
        "muscle-up-2",
        "Transition footage review",
        "Record attempts and note what breaks first: height, timing, or turnover."
      ),
    ],
    demonstration: {
      title: "Perform a clean muscle-up",
      description: "Execute a controlled muscle-up without excessive kip or scramble.",
      completed: false,
    },
    suggestions: [
      "Keep vertical pull work alive while chasing the transition.",
      "Capstones should feel like proof, not just accumulated effort.",
    ],
  },
  {
    id: "pistol-squat-standard",
    pathId: "athletics",
    title: "Pistol Squat Standard",
    branch: "Capstone",
    description:
      "Own the full single-leg squat pattern strongly enough that it counts as a reliable physical skill.",
    position: { x: 58, y: 18 },
    prerequisites: ["lower-body-control"],
    nodeType: "capstone",
    milestones: [
      proofMilestone(
        "pistol-standard-1",
        "Consistency check",
        "Capture or log multiple sessions that show the skill is stable, not lucky."
      ),
    ],
    demonstration: {
      title: "Perform repeatable pistol squats",
      description: "Demonstrate the skill on demand with control and balanced mechanics.",
      completed: false,
    },
    demonstrationBypassesMilestones: true,
    suggestions: [
      "If you already own pistol squats, the demonstration can master this node directly.",
    ],
  },
];

export const SCIENCE_TECH_TREE: SkillNode[] = [
  {
    id: "optics-fundamentals",
    pathId: "science-tech",
    title: "Optics Fundamentals",
    branch: "Optics",
    description:
      "Build enough optics intuition to reason about light paths, lenses, waveguides, and image quality.",
    position: { x: 22, y: 68 },
    prerequisites: [],
    nodeType: "foundation",
    milestones: [
      checkboxMilestone(
        "optics-1",
        "Complete lesson sequence",
        "Finish a first-pass optics course or textbook block."
      ),
      proofMilestone(
        "optics-2",
        "Explain focal behavior",
        "Write or sketch your own explanation of focal length, field of view, and aberrations."
      ),
      checkboxMilestone(
        "optics-3",
        "Lens experiment notes",
        "Run a simple lens experiment and capture what changed.",
      ),
    ],
    demonstration: {
      title: "Teach the basics back",
      description: "Explain the optics concepts in your own words with working examples.",
      completed: false,
    },
    suggestions: [
      "Favor experiments and sketches over passive reading alone.",
    ],
  },
  {
    id: "display-systems",
    pathId: "science-tech",
    title: "Display Systems",
    branch: "Displays",
    description:
      "Understand how microdisplays, projection methods, brightness, and optical coupling affect near-eye systems.",
    position: { x: 40, y: 50 },
    prerequisites: ["optics-fundamentals"],
    nodeType: "skill",
    milestones: [
      checkboxMilestone(
        "display-1",
        "Survey display architectures",
        "Compare microLED, LCOS, OLED, and projection approaches for near-eye use."
      ),
      proofMilestone(
        "display-2",
        "Brightness tradeoff memo",
        "Document the main display tradeoffs relevant to a contact-lens form factor."
      ),
      checkboxMilestone(
        "display-3",
        "Prototype-oriented shortlist",
        "Create a shortlist of display paths worth testing first."
      ),
    ],
    demonstration: {
      title: "Present the chosen display direction",
      description: "Make a justified recommendation for which display path to prototype next.",
      completed: false,
    },
    suggestions: [
      "This node matters only if it narrows your prototype direction.",
    ],
  },
  {
    id: "embedded-systems-basics",
    pathId: "science-tech",
    title: "Embedded Systems Basics",
    branch: "Electronics",
    description:
      "Build enough electronics and firmware fluency to drive tests, sensors, and prototype control loops.",
    position: { x: 58, y: 50 },
    prerequisites: [],
    nodeType: "skill",
    milestones: [
      checkboxMilestone(
        "embedded-1",
        "Microcontroller setup",
        "Bring up a microcontroller environment and blink, read, and log successfully."
      ),
      proofMilestone(
        "embedded-2",
        "Sensor test rig",
        "Build a simple rig that reads a sensor and logs useful data."
      ),
      checkboxMilestone(
        "embedded-3",
        "Power constraints review",
        "Capture what power, heat, and size constraints mean for near-eye hardware."
      ),
    ],
    demonstration: {
      title: "Show a working embedded prototype loop",
      description: "Run a functioning sensor or control prototype that produces stable output.",
      completed: false,
    },
    suggestions: [
      "Stay close to hardware behavior, not just firmware tutorials.",
    ],
  },
  {
    id: "test-rig-design",
    pathId: "science-tech",
    title: "Test Rig Design",
    branch: "Prototyping",
    description:
      "Design repeatable experiments that let you validate optics, materials, alignment, and sensing assumptions.",
    position: { x: 72, y: 50 },
    prerequisites: ["optics-fundamentals", "embedded-systems-basics"],
    nodeType: "skill",
    milestones: [
      checkboxMilestone(
        "testrig-1",
        "Define the first validation question",
        "Choose the single most important thing the rig must prove."
      ),
      proofMilestone(
        "testrig-2",
        "Build rig v1",
        "Assemble a first-pass rig that can actually run the experiment."
      ),
      proofMilestone(
        "testrig-3",
        "Document results",
        "Capture measurements, photos, and failure notes from the first run."
      ),
    ],
    demonstration: {
      title: "Run the rig end-to-end",
      description: "Demonstrate a working rig that produces evidence, not just setup photos.",
      completed: false,
    },
    suggestions: [
      "The value of this node is in usable evidence, not theoretical completeness.",
    ],
  },
  {
    id: "ar-contact-lens-prototype",
    pathId: "science-tech",
    title: "AR Contact-Lens Prototype",
    branch: "Capstone",
    description:
      "Integrate optics, display reasoning, embedded behavior, and test evidence into a real proof of concept.",
    position: { x: 56, y: 18 },
    prerequisites: ["display-systems", "test-rig-design"],
    nodeType: "capstone",
    milestones: [
      checkboxMilestone(
        "arlens-1",
        "Prototype architecture chosen",
        "Define the first realistic prototype architecture and its constraints."
      ),
      proofMilestone(
        "arlens-2",
        "Subsystem integration log",
        "Document how optics, electronics, and fabrication assumptions fit together."
      ),
      proofMilestone(
        "arlens-3",
        "Proof-of-concept experiment",
        "Run a prototype experiment that proves one critical capability."
      ),
    ],
    demonstration: {
      title: "Present a functioning proof of concept",
      description: "Show a prototype or rig output that demonstrates real near-eye AR progress.",
      completed: false,
    },
    suggestions: [
      "Prototype momentum should outrank passive study whenever possible.",
      "Let each milestone reduce uncertainty in a real subsystem.",
    ],
  },
];

export const DEFAULT_CATALOG: TreeCatalog = {
  paths: PATHS,
  skillTrees: {
    athletics: ATHLETICS_TREE,
    mandarin: [],
    philosophy: [],
    "science-tech": SCIENCE_TECH_TREE,
    geopolitics: [],
  },
};
