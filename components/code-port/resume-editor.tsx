"use client";

import type { ResumeData } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-[1.35rem] border border-white/35 bg-white/26 p-4">
      <p className="section-title">{title}</p>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(22,49,60,0.52)]">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-24 w-full rounded-[1rem] border border-[rgba(22,49,60,0.1)] bg-white/68 px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[1rem] border border-[rgba(22,49,60,0.1)] bg-white/68 px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
        />
      )}
    </label>
  );
}

export function ResumeEditor({
  resumeData,
  onChange,
}: {
  resumeData: ResumeData;
  onChange: (next: ResumeData) => void;
}) {
  const updateBasics = (key: keyof ResumeData["basics"], value: string) => {
    onChange({
      ...resumeData,
      basics: {
        ...resumeData.basics,
        [key]: value,
      },
    });
  };

  const updateSkills = (key: keyof ResumeData["skills"], value: string) => {
    onChange({
      ...resumeData,
      skills: {
        ...resumeData.skills,
        [key]: value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
    });
  };

  const updateExperience = (index: number, key: keyof ResumeData["experience"][number], value: string) => {
    const next = [...resumeData.experience];
    const item = next[index];
    next[index] = {
      ...item,
      [key]: key === "achievements"
        ? value.split("\n").map((entry) => entry.trim()).filter(Boolean)
        : value,
    };
    onChange({ ...resumeData, experience: next });
  };

  const updateProject = (index: number, key: keyof ResumeData["projects"][number], value: string) => {
    const next = [...resumeData.projects];
    const item = next[index];
    next[index] = {
      ...item,
      [key]: key === "technologies"
        ? value.split(",").map((entry) => entry.trim()).filter(Boolean)
        : value,
    };
    onChange({ ...resumeData, projects: next });
  };

  return (
    <div className="space-y-4">
      <Section title="Manual Edit">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Full Name" value={resumeData.basics.name} onChange={(value) => updateBasics("name", value)} />
          <Field label="Headline" value={resumeData.basics.headline} onChange={(value) => updateBasics("headline", value)} />
          <Field label="Email" value={resumeData.basics.email} onChange={(value) => updateBasics("email", value)} />
          <Field label="Phone" value={resumeData.basics.phone} onChange={(value) => updateBasics("phone", value)} />
          <Field label="Location" value={resumeData.basics.location} onChange={(value) => updateBasics("location", value)} />
          <Field label="Website" value={resumeData.basics.website} onChange={(value) => updateBasics("website", value)} />
          <Field label="LinkedIn" value={resumeData.basics.linkedin} onChange={(value) => updateBasics("linkedin", value)} />
          <Field label="GitHub" value={resumeData.basics.github} onChange={(value) => updateBasics("github", value)} />
        </div>
        <Field
          label="Professional Summary"
          value={resumeData.basics.summary}
          onChange={(value) => updateBasics("summary", value)}
          textarea
        />
      </Section>

      <Section title="Skills">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Core Skills" value={resumeData.skills.core.join(", ")} onChange={(value) => updateSkills("core", value)} />
          <Field label="Tools" value={resumeData.skills.tools.join(", ")} onChange={(value) => updateSkills("tools", value)} />
          <Field label="Languages" value={resumeData.skills.languages.join(", ")} onChange={(value) => updateSkills("languages", value)} />
        </div>
      </Section>

      {resumeData.experience.map((item, index) => (
        <Section key={`${item.company}-${index}`} title={`Experience ${index + 1}`}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Role" value={item.role} onChange={(value) => updateExperience(index, "role", value)} />
            <Field label="Company" value={item.company} onChange={(value) => updateExperience(index, "company", value)} />
            <Field label="Location" value={item.location} onChange={(value) => updateExperience(index, "location", value)} />
            <Field label="Start Date" value={item.startDate} onChange={(value) => updateExperience(index, "startDate", value)} />
            <Field label="End Date" value={item.endDate} onChange={(value) => updateExperience(index, "endDate", value)} />
          </div>
          <Field
            label="Achievements"
            value={item.achievements.join("\n")}
            onChange={(value) => updateExperience(index, "achievements", value)}
            textarea
          />
        </Section>
      ))}

      {resumeData.projects.map((item, index) => (
        <Section key={`${item.name}-${index}`} title={`Project ${index + 1}`}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Project Name" value={item.name} onChange={(value) => updateProject(index, "name", value)} />
            <Field label="Project Link" value={item.link} onChange={(value) => updateProject(index, "link", value)} />
          </div>
          <Field label="Description" value={item.description} onChange={(value) => updateProject(index, "description", value)} textarea />
          <Field label="Technologies" value={item.technologies.join(", ")} onChange={(value) => updateProject(index, "technologies", value)} />
        </Section>
      ))}
    </div>
  );
}
