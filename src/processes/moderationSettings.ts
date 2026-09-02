import { supabase } from "@/lib/supabase";
import type { ModerationSettings } from "@/types/moderationSettings";

const TABLE = "moderation_settings";

export async function fetchModerationSettings(): Promise<ModerationSettings> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("auto_moderation_enabled, updated_at")
    .eq("id", 1)
    .single();

  if (error) throw new Error(error.message);
  return {
    autoModerationEnabled: data.auto_moderation_enabled,
    updatedAt: data.updated_at,
  };
}

export async function updateAutoModerationEnabled(
  enabled: boolean,
  adminId: string
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ auto_moderation_enabled: enabled, updated_by: adminId, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) throw new Error(error.message);
}
