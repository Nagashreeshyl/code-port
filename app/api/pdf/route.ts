import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePdfDocument } from "@/lib/pdf-document";
import { pdfRequestSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { resumeData, fileName } = pdfRequestSchema.parse(await request.json());
    const buffer = await renderToBuffer(
      ResumePdfDocument({ resumeData }),
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create PDF.";
    return Response.json({ error: message }, { status: 400 });
  }
}
