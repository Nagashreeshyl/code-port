import { generateResumeTurn } from "@/lib/groq";
import { chatRequestSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = chatRequestSchema.parse(await request.json());
    const response = await generateResumeTurn(payload);
    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to continue the resume interview.";

    return Response.json({ error: message }, { status: 400 });
  }
}
