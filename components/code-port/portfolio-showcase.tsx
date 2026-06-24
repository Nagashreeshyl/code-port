"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Download, ExternalLink, Mail, MapPin, MoveUpRight, Phone } from "lucide-react";
import { InteractivePreviewLink } from "@/components/code-port/interactive-preview-link";
import { PortfolioScene } from "@/components/code-port/portfolio-scene";
import { createEmptyResumeData, makeFileSafeName, normalizeExternalUrl } from "@/lib/resume";
import type { ResumeData, StoredProject } from "@/lib/types";

const STORAGE_PREFIX = "code-port:project:";

function formatDuration(startDate: string, endDate: string) {
  return [startDate, endDate || "Present"].filter(Boolean).join(" - ");
}

export function PortfolioShowcase({ projectId }: { projectId: string }) {
  const [resumeData, setResumeData] = useState<ResumeData>(createEmptyResumeData());
  const [ready, setReady] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);

    if (raw) {
      try {
        const project = JSON.parse(raw) as StoredProject;
        startTransition(() => {
          setResumeData(project.resumeData);
          setReady(true);
        });
      } catch {
        startTransition(() => {
          setReady(true);
        });
      }
    }

    void fetch(`/api/projects/${projectId}`)
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
          setResumeData(project.resumeData);
          setReady(true);
        });
      })
      .catch(() => {
        startTransition(() => {
          setReady(true);
        });
      });
  }, [projectId]);

  const skillList = useMemo(
    () => [...resumeData.skills.core, ...resumeData.skills.tools, ...resumeData.skills.languages],
    [resumeData.skills],
  );

  async function downloadResume() {
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
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${makeFileSafeName(resumeData.basics.name || "code-port-resume")}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1800);
  }

  const primaryLinks = [
    { label: "Website", href: resumeData.basics.website },
    { label: "LinkedIn", href: resumeData.basics.linkedin },
    { label: "GitHub", href: resumeData.basics.github },
  ].filter((item) => item.href);
  const [shareUrl, setShareUrl] = useState(`/portfolio/${projectId}`);

  useEffect(() => {
    startTransition(() => {
      setShareUrl(window.location.href);
    });
  }, []);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] flex flex-col gap-5">
        <div className="glass-panel rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/36 px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Interview
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={copyShareLink}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/36 px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                <Copy className="h-4 w-4" />
                {shareCopied ? "Share Link Copied" : "Copy Public Share Link"}
              </button>
              <button
                onClick={downloadResume}
                className="liquid-button inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" />
                Download Resume PDF
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative rounded-[2rem] border border-white/40 bg-[rgba(255,255,255,0.22)] p-6 sm:p-8"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(141,183,179,0.3),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(198,140,93,0.18),transparent_30%)]" />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
                {resumeData.basics.photoDataUrl ? (
                  <Image
                    src={resumeData.basics.photoDataUrl}
                    alt={resumeData.basics.name || "Profile"}
                    width={160}
                    height={188}
                    unoptimized
                    className="h-[188px] w-[160px] rounded-[1.8rem] object-cover shadow-[0_24px_48px_rgba(45,73,88,0.2)]"
                  />
                ) : null}
                <div className="max-w-2xl space-y-6">
                  <p className="section-title">Public Portfolio</p>
                  <div className="space-y-4">
                    <h1 className="serif-display text-5xl leading-tight text-[var(--foreground)] sm:text-6xl">
                      {resumeData.basics.name || "Your Name"}
                    </h1>
                    <p className="text-xl font-semibold text-[var(--accent)]">
                      {resumeData.basics.headline || "Professional headline"}
                    </p>
                    <p className="max-w-xl text-base leading-8 text-[rgba(22,49,60,0.72)]">
                      {resumeData.basics.summary ||
                        "Complete the interview in Code Port to generate a richer story, achievements, and portfolio narrative."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {skillList.slice(0, 8).map((skill) => (
                      <span
                        key={skill}
                        className="glass-chip rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
                    <div className="rounded-[1.6rem] bg-white/42 p-5">
                      <p className="section-title">Contact</p>
                      <div className="mt-4 space-y-3 text-sm text-[rgba(22,49,60,0.74)]">
                        <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{resumeData.basics.email || "email@example.com"}</p>
                        <p className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{resumeData.basics.phone || "+1 (000) 000-0000"}</p>
                        <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{resumeData.basics.location || "Your location"}</p>
                      </div>
                    </div>
                    <div className="rounded-[1.6rem] bg-white/28 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="section-title">Interactive Links</p>
                        <span className="rounded-full bg-white/60 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[rgba(22,49,60,0.58)]">
                          Shareable
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {primaryLinks.length > 0 ? primaryLinks.map((link) => (
                          <InteractivePreviewLink
                            key={link.label}
                            href={link.href}
                            label={link.label}
                            compact
                          />
                        )) : (
                          <p className="text-sm text-[rgba(22,49,60,0.74)]">Add portfolio, LinkedIn, or GitHub links in the interview.</p>
                        )}
                      </div>
                      <div className="mt-4 rounded-[1.1rem] bg-white/44 px-4 py-3 text-xs leading-6 text-[rgba(22,49,60,0.66)]">
                        Public URL: {shareUrl}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 26 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
              className="glass-panel relative min-h-[320px] rounded-[2rem]"
            >
              <PortfolioScene />
              <div className="absolute inset-x-0 bottom-0 z-10 p-6">
                <div className="rounded-[1.5rem] border border-white/40 bg-white/32 p-4 backdrop-blur-xl">
                  <p className="section-title">Portfolio Motion</p>
                  <p className="mt-2 text-sm leading-7 text-[rgba(22,49,60,0.74)]">
                    This portfolio is public by project link. Share this page directly, and use the interactive link chips to preview external sites from inside the experience.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            <div className="glass-panel rounded-[2rem] p-6">
              <p className="section-title">Career Snapshot</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{resumeData.experience.length}</p>
              <p className="mt-2 text-sm leading-7 text-[rgba(22,49,60,0.68)]">
                experience entries shaped into a public portfolio story.
              </p>
            </div>
            <div className="glass-panel rounded-[2rem] p-6">
              <p className="section-title">Selected Experience</p>
              <div className="mt-5 space-y-5">
              {resumeData.experience.length > 0 ? (
                resumeData.experience.map((item, index) => (
                    <div key={`${item.company}-${index}`} className="rounded-[1.4rem] bg-white/34 p-4 transition hover:bg-white/44">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">{item.role || "Role"}</h2>
                        <p className="mt-1 text-sm text-[rgba(22,49,60,0.62)]">{item.company || "Company"}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[rgba(22,49,60,0.48)]">
                        {formatDuration(item.startDate, item.endDate)}
                      </p>
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-[rgba(22,49,60,0.72)]">
                      {item.achievements.length > 0 ? (
                        item.achievements.map((achievement) => <p key={achievement}>• {achievement}</p>)
                      ) : (
                        <p>{item.location || "Add more detail in the interview to enrich this card."}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] bg-white/34 p-4 text-sm leading-7 text-[rgba(22,49,60,0.72)]">
                  {ready
                    ? "Experience cards will appear here once the resume interview collects your work history."
                    : "Loading your portfolio data..."}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.16 }}
            className="flex flex-col gap-5"
          >
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-title">Featured Projects</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Work shaped into an interactive showcase</h2>
                </div>
                <ExternalLink className="h-5 w-5 text-[rgba(22,49,60,0.56)]" />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {resumeData.projects.length > 0 ? (
                  resumeData.projects.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="rounded-[1.5rem] bg-white/30 p-4 transition hover:bg-white/40">
                      <p className="text-lg font-semibold text-[var(--foreground)]">{item.name || "Project"}</p>
                      <p className="mt-2 text-sm leading-7 text-[rgba(22,49,60,0.72)]">
                        {item.description || "Project summary pending."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.technologies.map((technology) => (
                          <span
                            key={technology}
                            className="rounded-full bg-[rgba(47,127,129,0.08)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                      {item.link ? (
                        <div className="mt-4">
                          <InteractivePreviewLink
                            href={item.link}
                            label="Open Project Preview"
                            description={normalizeExternalUrl(item.link)}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                <div className="rounded-[1.5rem] bg-white/30 p-4 text-sm leading-7 text-[rgba(22,49,60,0.72)] md:col-span-2">
                    Add project details in the chat to populate this section with richer website cards.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-title">Public Presence</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Link out to your professional ecosystem</h2>
                </div>
                <MoveUpRight className="h-5 w-5 text-[rgba(22,49,60,0.56)]" />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {primaryLinks.length > 0 ? primaryLinks.map((link) => (
                  <div key={link.label} className="rounded-[1.5rem] bg-white/30 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(22,49,60,0.5)]">{link.label}</p>
                    <div className="mt-4">
                      <InteractivePreviewLink href={link.href} label={`Preview ${link.label}`} description={link.href} />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.5rem] bg-white/30 p-4 text-sm leading-7 text-[rgba(22,49,60,0.72)] md:col-span-3">
                    Add external professional links in the interview or manual editor to populate this section.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <p className="section-title">Education</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {resumeData.education.length > 0 ? (
                  resumeData.education.map((item, index) => (
                    <div key={`${item.school}-${index}`} className="rounded-[1.5rem] bg-white/30 p-4">
                      <p className="text-lg font-semibold text-[var(--foreground)]">{item.school || "School"}</p>
                      <p className="mt-2 text-sm leading-7 text-[rgba(22,49,60,0.72)]">
                        {[item.degree, item.fieldOfStudy].filter(Boolean).join(" in ") || "Degree details pending."}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[rgba(22,49,60,0.5)]">
                        {formatDuration(item.startDate, item.endDate)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] bg-white/30 p-4 text-sm leading-7 text-[rgba(22,49,60,0.72)] md:col-span-2">
                    Academic details will appear once they are collected by the AI interview.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
