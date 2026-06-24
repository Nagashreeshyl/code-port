import Image from "next/image";
import type { ResumeData } from "@/lib/types";

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t border-[var(--line)] pt-4 first:border-t-0 first:pt-0">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[rgba(22,49,60,0.5)]">
        {title}
      </p>
      {children}
    </section>
  );
}

export function ResumePreview({ resumeData }: { resumeData: ResumeData }) {
  const { basics, experience, education, skills, projects } = resumeData;

  return (
    <div className="glass-panel rounded-[1.8rem] p-5 sm:p-6">
      <div className="rounded-[1.45rem] bg-[rgba(252,249,245,0.88)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <div className="flex items-start gap-4 border-b border-[var(--line)] pb-5">
          {basics.photoDataUrl ? (
            <Image
              src={basics.photoDataUrl}
              alt={basics.name || "Profile"}
              width={92}
              height={108}
              unoptimized
              className="h-[108px] w-[92px] rounded-[1.2rem] object-cover shadow-[0_10px_24px_rgba(45,73,88,0.14)]"
            />
          ) : null}
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="serif-display text-2xl text-[var(--foreground)]">
              {basics.name || "Your Name"}
            </h2>
            <p className="text-sm font-medium text-[var(--accent)]">
              {basics.headline || "Professional headline"}
            </p>
            <p className="text-xs leading-5 text-[rgba(22,49,60,0.65)]">
              {[basics.email, basics.phone, basics.location]
                .filter(Boolean)
                .join("  |  ") || "Email, phone, and location will appear here."}
            </p>
            {[basics.website, basics.linkedin, basics.github].filter(Boolean).length > 0 ? (
              <p className="text-[0.72rem] leading-5 text-[rgba(22,49,60,0.58)]">
                {[basics.website, basics.linkedin, basics.github].filter(Boolean).join("  |  ")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-6 resume-text">
          <PreviewSection title="Profile">
            <p>{basics.summary || "A concise summary will update here in real time as the interview progresses."}</p>
          </PreviewSection>

          <PreviewSection title="Experience">
            {experience.length > 0 ? (
              <div className="space-y-3">
                {experience.slice(0, 2).map((item, index) => (
                  <div key={`${item.company}-${index}`} className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <p className="font-semibold text-[var(--foreground)]">
                        {item.role || "Role"}
                      </p>
                      <p className="text-xs text-[rgba(22,49,60,0.58)]">
                        {[item.startDate, item.endDate].filter(Boolean).join(" - ")}
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(22,49,60,0.48)]">
                      {[item.company, item.location].filter(Boolean).join("  |  ")}
                    </p>
                    {item.achievements.length > 0 ? (
                      <ul className="space-y-1 text-[0.84rem] leading-5 text-[rgba(22,49,60,0.76)]">
                        {item.achievements.slice(0, 2).map((achievement) => (
                          <li key={achievement}>• {achievement}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p>Your work history will appear here.</p>
            )}
          </PreviewSection>

          <PreviewSection title="Skills">
            <div className="flex flex-wrap gap-2">
              {[...skills.core, ...skills.tools, ...skills.languages].slice(0, 8).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[rgba(47,127,129,0.08)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                >
                  {skill}
                </span>
              ))}
              {skills.core.length + skills.tools.length + skills.languages.length === 0 ? (
                <span className="text-sm text-[rgba(22,49,60,0.64)]">Skills will appear here.</span>
              ) : null}
            </div>
          </PreviewSection>

          <PreviewSection title="Education">
            {education.length > 0 ? (
              <div className="space-y-2">
                {education.slice(0, 2).map((item, index) => (
                  <div key={`${item.school}-${index}`}>
                    <p className="font-semibold text-[var(--foreground)]">{item.school || "School"}</p>
                    <p className="text-xs text-[rgba(22,49,60,0.6)]">
                      {[item.degree, item.fieldOfStudy, item.endDate].filter(Boolean).join("  |  ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Your academic background will appear here.</p>
            )}
          </PreviewSection>

          <PreviewSection title="Projects">
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.slice(0, 2).map((item, index) => (
                  <div key={`${item.name}-${index}`}>
                    <p className="font-semibold text-[var(--foreground)]">{item.name || "Project"}</p>
                    <p className="text-[0.84rem] leading-5 text-[rgba(22,49,60,0.76)]">
                      {item.description || "Description pending."}
                    </p>
                    {item.link ? (
                      <p className="mt-1 break-all text-[0.72rem] leading-5 text-[rgba(22,49,60,0.55)]">{item.link}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p>Featured projects will appear here.</p>
            )}
          </PreviewSection>
        </div>
      </div>
    </div>
  );
}
