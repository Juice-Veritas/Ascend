import {
  type ActivityTypeId,
  type PathId,
  type SessionLog,
} from "@/lib/ascend-data";

export type PersistedAscendState = {
  selectedPathId: PathId;
  activeMissionId: string;
  selectedActivityType: ActivityTypeId;
  xpByNode: Record<string, number>;
  sessionFeed: SessionLog[];
};

const STORAGE_KEY = "ascend-app-state";

export const defaultAscendState: PersistedAscendState = {
  selectedPathId: "athletics",
  activeMissionId: "physical-foundation",
  selectedActivityType: "focused",
  xpByNode: {
    "physical-foundation": 70,
    handstand: 28,
    mobility: 18,
  },
  sessionFeed: [],
};

export function readLocalAscendState() {
  if (typeof window === "undefined") {
    return defaultAscendState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultAscendState;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedAscendState>;

    return {
      ...defaultAscendState,
      ...parsed,
      xpByNode: {
        ...defaultAscendState.xpByNode,
        ...(parsed.xpByNode ?? {}),
      },
      sessionFeed: parsed.sessionFeed ?? defaultAscendState.sessionFeed,
    };
  } catch {
    return defaultAscendState;
  }
}

export function writeLocalAscendState(state: PersistedAscendState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
