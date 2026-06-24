import { createClient } from "@supabase/supabase-js";
import type { StoredProject } from "@/lib/types";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function upsertProject(project: StoredProject) {
  const client = getClient();

  if (!client) {
    return false;
  }

  const { error } = await client.from("projects").upsert({
    id: project.id,
    resume_data: project.resumeData,
    conversation: project.conversation,
    portfolio_ready: project.portfolioReady,
    updated_at: project.updatedAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getProject(id: string): Promise<StoredProject | null> {
  const client = getClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("projects")
    .select("id, resume_data, conversation, portfolio_ready, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    resumeData: data.resume_data,
    conversation: data.conversation,
    portfolioReady: data.portfolio_ready,
    updatedAt: data.updated_at,
  } as StoredProject;
}
