import type { NextRequest } from "next/server";
import { normalizeExternalUrl } from "@/lib/resume";

export const runtime = "nodejs";

function extractMetaTag(html: string, patterns: string[]) {
  for (const pattern of patterns) {
    const regex = new RegExp(
      `<meta[^>]+(?:property|name)=["']${pattern}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${pattern}["'][^>]*>`,
      "i",
    );
    const match = html.match(regex);
    const content = match?.[1] ?? match?.[2];

    if (content) {
      return content.trim();
    }
  }

  return "";
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return Response.json({ error: "Missing url." }, { status: 400 });
  }

  const url = normalizeExternalUrl(rawUrl);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Code-Port-Link-Preview/1.0",
      },
    });

    const html = await response.text();
    const title = extractMetaTag(html, ["og:title", "twitter:title"]) || extractTitle(html);
    const description = extractMetaTag(html, ["description", "og:description", "twitter:description"]);
    const image = extractMetaTag(html, ["og:image", "twitter:image"]);
    const siteName = extractMetaTag(html, ["og:site_name"]) || new URL(url).hostname.replace(/^www\./, "");

    return Response.json({
      url,
      title: title || siteName,
      description,
      image,
      siteName,
    });
  } catch {
    return Response.json(
      {
        url,
        title: new URL(url).hostname.replace(/^www\./, ""),
        description: "Preview metadata could not be loaded for this link.",
        image: "",
        siteName: new URL(url).hostname.replace(/^www\./, ""),
      },
      { status: 200 },
    );
  }
}
