"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, ImagePlus, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { AmbientScene } from "@/components/code-port/ambient-scene";
import { ResumeEditor } from "@/components/code-port/resume-editor";
import { ResumePreview } from "@/components/code-port/resume-preview";
import {
  createEmptyResumeData,
  createStoredProject,
  makeFileSafeName,
  starterAssistantMessage,
} from "@/lib/resume";
import type { ChatMessage, ResumeData, StoredProject } from "@/lib/types";

const STORAGE_PREFIX = "code-port:project:";
const ACTIVE_PROJECT_KEY = "code-port:active-project";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

function readProjectFromStorage(projectId: string) {
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredProject;
  } catch {
    return null;
  }
}

export function ChatExperience() {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", starterAssistantMessage),
  ]);
  const [resumeData, setResumeData] = useState<ResumeData>(createEmptyResumeData());
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);
  const [status, setStatus] = useState("Tell Code Port about your background to start building.");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasUserMessages = useMemo(() => messages.some((m) => m.role === "user"), [messages]);
  const [isConversationAtTop, setIsConversationAtTop] = useState(!hasUserMessages);

  const previewData = useDeferredValue(resumeData);

  const completion = useMemo(() => {
    const filledBasics = [
      resumeData.basics.name,
      resumeData.basics.headline,
      resumeData.basics.email,
      resumeData.basics.summary,
    ].filter(Boolean).length;

    return Math.min(
      100,
      filledBasics * 12 +
        Math.min(resumeData.experience.length, 2) * 18 +
        Math.min(resumeData.projects.length, 2) * 10 +
        Math.min(resumeData.education.length, 1) * 12 +
        Math.min(
          resumeData.skills.core.length +
            resumeData.skills.tools.length +
            resumeData.skills.languages.length,
          8,
        ) * 2,
    );
  }, [resumeData]);

  async function persistProject(project: StoredProject) {
    window.localStorage.setItem(`${STORAGE_PREFIX}${project.id}`, JSON.stringify(project));
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);

    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
    } catch {
      // Local storage remains the primary fallback for the no-auth MVP.
    }
  }

  useEffect(() => {
    const existingId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
    const nextId = existingId ?? crypto.randomUUID();
    const cachedProject = readProjectFromStorage(nextId);

    startTransition(() => {
      setProjectId(nextId);

      if (cachedProject) {
        setMessages(cachedProject.conversation);
        setResumeData(cachedProject.resumeData);
        setStatus("Restored your previous Code Port session.");
        return;
      }

      setMessages([createMessage("assistant", starterAssistantMessage)]);
      setResumeData(createEmptyResumeData());
    });

    if (!cachedProject) {
      void fetch(`/api/projects/${nextId}`)
        .then(async (response) => {
          if (!response.ok) {
            return null;
          }

          const data = (await response.json()) as { project?: StoredProject };
          return data.project ?? null;
        })
        .then((project) => {
          if (!project) {
            return;
          }

          startTransition(() => {
            setMessages(project.conversation);
            setResumeData(project.resumeData);
            setStatus("Loaded your latest synced resume state.");
          });
        })
        .catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void persistProject(
        createStoredProject({
          id: projectId,
          resumeData,
          conversation: messages,
        }),
      );
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [messages, projectId, resumeData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (hasUserMessages) {
      setIsConversationAtTop(false);
    }
  }, [hasUserMessages]);

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isSending) {
      return;
    }

    const nextConversation = [...messages, createMessage("user", trimmed)];

    setError("");
    setInput("");
    setIsSending(true);
    setMessages(nextConversation);
    setIsConversationAtTop(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          messages: nextConversation,
          resumeData,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        assistantMessage: string;
        resumeData: ResumeData;
        completionScore: number;
        isComplete: boolean;
      };

      if (!response.ok) {
        throw new Error(data.error || "Code Port could not process that reply.");
      }

      startTransition(() => {
        setMessages([
          ...nextConversation,
          createMessage("assistant", data.assistantMessage),
        ]);
        setResumeData(data.resumeData);
        setStatus(
          data.isComplete
            ? "Resume looks strong. You can export the PDF or generate the 3D portfolio now."
            : `Resume progress: ${data.completionScore}% complete.`,
        );
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while contacting the AI interviewer.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleDownloadPdf() {
    setIsDownloading(true);
    setError("");

    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData,
          fileName: makeFileSafeName(resumeData.basics.name || "code-port-resume"),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to generate PDF.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${makeFileSafeName(resumeData.basics.name || "code-port-resume")}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleGeneratePortfolio() {
    if (!projectId) {
      return;
    }

    setIsGeneratingPortfolio(true);
    await persistProject(
      createStoredProject({
        id: projectId,
        resumeData,
        conversation: messages,
        portfolioReady: true,
      }),
    );
    router.push(`/portfolio/${projectId}`);
  }

  async function handleHeadshotUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setError("Please upload a JPG or PNG headshot.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not read the uploaded image."));
      reader.readAsDataURL(file);
    });

    startTransition(() => {
      setResumeData((current) => ({
        ...current,
        basics: {
          ...current.basics,
          photoDataUrl: dataUrl,
        },
      }));
      setStatus("Headshot added to the resume and portfolio.");
                      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          "Headshot received. I will use it in the professional PDF resume and the portfolio website layout.",
        ),
      ]);
    });

    event.target.value = "";
  }

  function handleManualResumeChange(nextResumeData: ResumeData) {
    startTransition(() => {
      setResumeData(nextResumeData);
      setStatus("Manual edits applied. Your preview, PDF, and portfolio stay in sync.");
    });
  }

  return (
    <main className="relative h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-[1500px] flex-col gap-5 overflow-hidden lg:flex-row">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7 lg:flex-[1.15]"
        >
          <AmbientScene />
          <div className="relative z-10 flex h-full min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/30 pb-5">
              <div className="space-y-3">
                <span className="glass-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(22,49,60,0.72)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Code Port
                </span>
                <motion.div
                  initial={false}
                  animate={{
                    height: isConversationAtTop && !hasUserMessages ? "auto" : 0,
                    opacity: isConversationAtTop && !hasUserMessages ? 1 : 0,
                    marginTop: isConversationAtTop && !hasUserMessages ? 0 : -4,
                  }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="max-w-2xl space-y-3 overflow-hidden"
                >
                  <h1 className="serif-display max-w-3xl text-xl leading-tight text-[var(--foreground)] sm:text-2xl">
                    An AI resume studio that turns a conversation into your next professional identity.
                  </h1>
                  <p className="max-w-2xl text-xs leading-6 text-[rgba(22,49,60,0.72)] sm:text-sm">
                    Share your background in a guided chat. Code Port shapes the resume live, exports a polished PDF, and can launch your animated 3D portfolio in one click.
                  </p>
                </motion.div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/35 bg-white/18 px-3 py-2 backdrop-blur-xl">
                <div className="rounded-full bg-white/40 px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
                  {completion}% complete
                </div>
                <div className="rounded-full bg-white/28 px-3 py-1.5 text-xs font-semibold text-[rgba(22,49,60,0.72)]">
                  {projectId.slice(0, 8) || "Draft"}
                </div>
              </div>
            </div>

            <div className="mt-5 flex-1 overflow-hidden rounded-[1.7rem] border border-white/28 bg-[rgba(255,255,255,0.18)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:p-5">
              <div className="flex h-full min-h-0 flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="section-title">AI Resume Interview</p>
                  <p className="text-xs text-[rgba(22,49,60,0.64)]">{status}</p>
                </div>

                <div
                  className="flex-1 space-y-3 overflow-y-auto pr-1"
                  onScroll={(event) => {
                    setIsConversationAtTop(event.currentTarget.scrollTop < 12);
                  }}
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={`${message.timestamp}-${index}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className={message.role === "assistant" ? "mr-8" : "ml-8"}
                    >
                      <div
                        className={[
                          "rounded-[1.45rem] px-4 py-3 text-sm leading-7 shadow-[0_16px_32px_rgba(45,73,88,0.08)]",
                          message.role === "assistant"
                            ? "border border-white/40 bg-white/54 text-[rgba(22,49,60,0.88)]"
                            : "liquid-button text-white",
                        ].join(" ")}
                      >
                        {message.content}
                      </div>
                    </motion.div>
                  ))}

                  {isSending ? (
                    <div className="mr-8">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/54 px-4 py-2 text-sm text-[rgba(22,49,60,0.72)]">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Code Port is shaping the next section...
                      </div>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={submitMessage} className="space-y-3">
                  <div className="glass-panel rounded-[1.5rem] p-3">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onFocus={() => setIsConversationAtTop(false)}
                      placeholder="Answer naturally. Code Port will structure the details into your resume automatically."
                      className="h-28 w-full resize-none bg-transparent px-2 py-1 text-sm leading-7 text-[var(--foreground)] outline-none placeholder:text-[rgba(22,49,60,0.42)]"
                    />
                  </div>

                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <label className="liquid-outline inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/36 px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/34">
                        <ImagePlus className="h-4 w-4" />
                        Upload Headshot
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          className="hidden"
                          onChange={handleHeadshotUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="liquid-outline inline-flex items-center justify-center gap-2 rounded-full border border-white/36 px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/34 disabled:opacity-60"
                      >
                        {isDownloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleGeneratePortfolio}
                        disabled={isGeneratingPortfolio || !resumeData.basics.name}
                        className="liquid-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
                      >
                        {isGeneratingPortfolio ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                        Generate 3D Portfolio
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSending || !input.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(22,49,60,0.12)] bg-[rgba(255,255,255,0.68)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white disabled:opacity-60"
                    >
                      Continue Interview
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  {error ? <p className="text-sm text-[#a14f48]">{error}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
          className="lg:h-full lg:w-[460px] lg:flex-shrink-0"
        >
          <div className="grid h-full min-h-0 gap-4 lg:grid-rows-[0.95fr_1.05fr]">
            <div className="glass-panel flex min-h-0 flex-col rounded-[2rem] p-5">
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p className="section-title">Live Resume Preview</p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(22,49,60,0.68)]">
                    The preview stays in sync with every answer so the resume evolves before you finish the interview.
                  </p>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <ResumePreview resumeData={previewData} />
              </div>
            </div>

            <div className="glass-panel flex min-h-0 flex-col rounded-[2rem] p-5">
              <div className="pb-4">
                <p className="section-title">Manual Polish</p>
                <p className="mt-2 text-sm leading-6 text-[rgba(22,49,60,0.68)]">
                  Refine the AI-generated resume directly. These edits also update the PDF and public portfolio.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <ResumeEditor resumeData={resumeData} onChange={handleManualResumeChange} />
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </main>
  );
}
