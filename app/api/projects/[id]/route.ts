import type { NextRequest } from "next/server";
import { getProject } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/projects/[id]">,
) {
  const { id } = await context.params;
  const project = await getProject(id);

  if (!project) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  return Response.json({ project });
}
