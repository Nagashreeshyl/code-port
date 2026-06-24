import Groq from "groq-sdk";
import { chatResponseSchema, type ChatRequest, type ChatResponse } from "@/lib/types";
import { createEmptyResumeData, getCompletionInsights, runFallbackResumeTurn } from "@/lib/resume";

const model = "llama-3.3-70b-versatile";
const openRouterModel = "openrouter/auto";

function buildPrompt(payload: ChatRequest) {
  return [
    {
      role: "system" as const,
      content:
        "You are Code Port, a premium AI resume interviewer. Ask exactly one focused next-step question at a time. Return only valid JSON with keys assistantMessage, resumeData, isComplete, completionScore, missingSections. Preserve all existing known details unless the user clearly corrects them. Normalize resumeData into the schema with basics, experience, education, skills, and projects. Keep assistantMessage concise, polished, and professional. Do not use markdown. completionScore must be a number from 0 to 100. missingSections should list still-incomplete parts such as summary, experience, or projects.",
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        instruction:
          "Update the full resumeData using the conversation and latest user message. Ask the single best next question needed to finish the resume.",
        latestMessage: payload.message,
        currentResumeData: payload.resumeData,
        conversation: payload.messages,
        emptyResumeShape: createEmptyResumeData(),
      }),
    },
  ];
}

export async function generateResumeTurn(payload: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey && !openRouterKey) {
    return runFallbackResumeTurn(payload.resumeData, payload.message);
  }

  try {
    if (apiKey) {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: buildPrompt(payload),
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error("The GROQ response did not include any content.");
      }

      return parseAndHydrateResponse(content);
    }
  } catch {
    if (!openRouterKey) {
      return runFallbackResumeTurn(payload.resumeData, payload.message);
    }
  }

  if (openRouterKey) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://code-port.local",
          "X-Title": "Code Port",
        },
        body: JSON.stringify({
          model: openRouterModel,
          temperature: 0.35,
          response_format: { type: "json_object" },
          messages: buildPrompt(payload),
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter request failed with status ${response.status}.`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("The OpenRouter response did not include any content.");
      }

      return parseAndHydrateResponse(content);
    } catch {
      return runFallbackResumeTurn(payload.resumeData, payload.message);
    }
  }

  return runFallbackResumeTurn(payload.resumeData, payload.message);
}

function parseAndHydrateResponse(content: string): ChatResponse {
  const parsed = chatResponseSchema.parse(JSON.parse(content));
  const insights = getCompletionInsights(parsed.resumeData);

  return {
    ...parsed,
    completionScore: Math.max(parsed.completionScore, insights.completionScore),
    isComplete: parsed.isComplete || insights.isComplete,
    missingSections: parsed.missingSections.length > 0 ? parsed.missingSections : insights.missingSections,
  };
}
