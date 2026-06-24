import { upsertProject } from "@/lib/supabase";
import { storedProjectSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = storedProjectSchema.parse(await request.json());
    const persisted = await upsertProject(payload);

    return Response.json({ ok: true, persisted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save project.";
    return Response.json({ error: message }, { status: 400 });
  }
}
