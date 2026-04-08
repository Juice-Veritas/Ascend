import { type Session } from "@supabase/supabase-js";

import {
  type ActivityTypeId,
  type PathId,
  type SessionLog,
  type TreeCatalog,
} from "@/lib/ascend-data";
import { DEFAULT_CATALOG } from "@/lib/ascend-data";
import {
  defaultAscendState,
  type PersistedAscendState,
} from "@/lib/ascend-storage";
import { supabase } from "@/lib/supabase";

type UserStateRow = {
  active_mission_id: string;
  selected_activity_type: ActivityTypeId;
  selected_path_id: PathId;
  session_feed: SessionLog[];
  tree_catalog: TreeCatalog | null;
  user_id: string;
  xp_by_node: Record<string, number>;
};

export type RemoteAscendPayload = {
  catalog: TreeCatalog;
  state: PersistedAscendState;
};

function normalizeCatalog(catalog: TreeCatalog | null | undefined): TreeCatalog {
  if (!catalog) {
    return DEFAULT_CATALOG;
  }

  return {
    paths: catalog.paths?.length ? catalog.paths : DEFAULT_CATALOG.paths,
    skillTrees: {
      ...DEFAULT_CATALOG.skillTrees,
      ...(catalog.skillTrees ?? {}),
    },
  };
}

function serializePayload(
  userId: string,
  state: PersistedAscendState,
  catalog: TreeCatalog
): UserStateRow {
  return {
    user_id: userId,
    selected_path_id: state.selectedPathId,
    active_mission_id: state.activeMissionId,
    selected_activity_type: state.selectedActivityType,
    xp_by_node: state.xpByNode,
    session_feed: state.sessionFeed,
    tree_catalog: catalog,
  };
}

function deserializePayload(row: UserStateRow | null): RemoteAscendPayload {
  if (!row) {
    return {
      catalog: DEFAULT_CATALOG,
      state: defaultAscendState,
    };
  }

  return {
    catalog: normalizeCatalog(row.tree_catalog),
    state: {
      selectedPathId: row.selected_path_id ?? defaultAscendState.selectedPathId,
      activeMissionId: row.active_mission_id ?? defaultAscendState.activeMissionId,
      selectedActivityType:
        row.selected_activity_type ?? defaultAscendState.selectedActivityType,
      xpByNode: {
        ...defaultAscendState.xpByNode,
        ...(row.xp_by_node ?? {}),
      },
      sessionFeed: row.session_feed ?? [],
    },
  };
}

export async function fetchSupabaseSession() {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function sendMagicLink(email: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.href : undefined,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOutSupabase() {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function loadRemoteAscendState(session: Session | null) {
  if (!supabase || !session?.user.id) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_rpg_state")
    .select(
      "user_id, selected_path_id, active_mission_id, selected_activity_type, xp_by_node, session_feed, tree_catalog"
    )
    .eq("user_id", session.user.id)
    .maybeSingle<UserStateRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return deserializePayload(data);
}

export async function saveRemoteAscendState(
  session: Session | null,
  state: PersistedAscendState,
  catalog: TreeCatalog
) {
  if (!supabase || !session?.user.id) {
    return;
  }

  const payload = serializePayload(session.user.id, state, normalizeCatalog(catalog));
  const { error } = await supabase.from("user_rpg_state").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    throw error;
  }
}
