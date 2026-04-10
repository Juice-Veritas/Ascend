import { type Milestone, type SkillNode } from "@/lib/ascend-data";

export type MilestoneGenerationInput = {
  nodeTitle: string;
  nodeDescription: string;
  parentBranch: string;
  nodeType: SkillNode["nodeType"];
  capstoneGoal?: string;
  intendedOutcome?: string;
};

export type MilestoneGenerationSuggestion = {
  milestones: Milestone[];
  suggestedPrerequisites: string[];
  demonstrationTitle: string;
  demonstrationDescription: string;
  rationale: string;
};

export interface MilestoneGenerator {
  suggest(input: MilestoneGenerationInput): Promise<MilestoneGenerationSuggestion>;
}

function makeCheckbox(id: string, title: string, description: string): Milestone {
  return {
    id,
    title,
    description,
    progressType: "checkbox",
    completed: false,
  };
}

function makeNumeric(
  id: string,
  title: string,
  description: string,
  targetValue: number
): Milestone {
  return {
    id,
    title,
    description,
    progressType: "numeric",
    targetValue,
    currentValue: 0,
    completed: false,
  };
}

function makeProof(id: string, title: string, description: string): Milestone {
  return {
    id,
    title,
    description,
    progressType: "demonstration",
    completed: false,
  };
}

export class PlaceholderMilestoneGenerator implements MilestoneGenerator {
  async suggest(input: MilestoneGenerationInput): Promise<MilestoneGenerationSuggestion> {
    const slug = input.nodeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const promptText = `${input.nodeTitle} ${input.nodeDescription} ${input.capstoneGoal ?? ""} ${
      input.intendedOutcome ?? ""
    }`.toLowerCase();
    const prototypeBiased =
      promptText.includes("prototype") ||
      promptText.includes("optic") ||
      promptText.includes("embedded") ||
      promptText.includes("sensor") ||
      promptText.includes("display") ||
      promptText.includes("experiment") ||
      promptText.includes("rig") ||
      promptText.includes("hardware");

    const milestones = prototypeBiased
      ? [
          makeCheckbox(
            `${slug}-research`,
            "Clarify the validation target",
            "Define the exact subsystem question or prototype constraint this node should resolve."
          ),
          makeProof(
            `${slug}-build`,
            "Build a test artifact",
            "Create a rig, experiment, or prototype artifact that makes the work concrete."
          ),
          makeProof(
            `${slug}-document`,
            "Capture findings and next iteration",
            "Document measurements, failures, and the exact change that should happen next."
          ),
        ]
      : [
          makeCheckbox(
            `${slug}-foundation`,
            "Lock the basics",
            "Establish the baseline technique, concept, or routine for this node."
          ),
          makeNumeric(
            `${slug}-volume`,
            "Accumulate repeatable reps",
            "Reach a meaningful amount of practice or completion volume.",
            input.nodeType === "foundation" ? 6 : 10
          ),
          makeProof(
            `${slug}-proof`,
            "Show applied competence",
            "Capture evidence that the skill can be used, not just studied."
          ),
        ];

    return {
      milestones,
      suggestedPrerequisites: prototypeBiased ? ["optics fundamentals", "test rig design"] : [],
      demonstrationTitle: prototypeBiased
        ? `Demonstrate a working ${input.nodeTitle.toLowerCase()} proof`
        : `Demonstrate ${input.nodeTitle} proficiency`,
      demonstrationDescription: prototypeBiased
        ? "Show a functioning test, prototype, or experiment that produces evidence, not just setup work."
        : "Show the skill in a way that would count outside the app.",
      rationale: prototypeBiased
        ? "Placeholder AI prioritized prototype-building, experiment loops, evidence capture, and demonstrable outputs."
        : "Placeholder AI prioritized a foundation, measurable repetition, and a final proof step.",
    };
  }
}

export const milestoneGenerator: MilestoneGenerator = new PlaceholderMilestoneGenerator();
