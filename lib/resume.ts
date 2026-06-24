import type { ChatMessage, ResumeData, StoredProject } from "@/lib/types";

export const starterAssistantMessage =
  "Let’s build your resume. Start with your full name and the role or professional headline you want this resume to target. You can also upload a professional JPG headshot at any time for the resume and portfolio.";

export function createEmptyResumeData(): ResumeData {
  return {
    basics: {
      name: "",
      headline: "",
      photoDataUrl: "",
      email: "",
      phone: "",
      location: "",
      summary: "",
      website: "",
      linkedin: "",
      github: "",
    },
    experience: [],
    education: [],
    skills: {
      core: [],
      tools: [],
      languages: [],
    },
    projects: [],
  };
}

export function createStoredProject({
  id,
  resumeData,
  conversation,
  portfolioReady = false,
}: {
  id: string;
  resumeData: ResumeData;
  conversation: ChatMessage[];
  portfolioReady?: boolean;
}): StoredProject {
  return {
    id,
    resumeData,
    conversation,
    portfolioReady,
    updatedAt: new Date().toISOString(),
  };
}

function splitCommaList(value: string) {
  return value
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function extractEmail(message: string) {
  return message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function extractPhone(message: string) {
  return message.match(/\+?[\d\s().-]{7,}/)?.[0]?.trim() ?? "";
}

function extractUrls(message: string) {
  return message.match(/https?:\/\/[^\s)]+/gi) ?? [];
}

export function getCompletionInsights(resumeData: ResumeData) {
  const missingSections: string[] = [];
  let score = 0;

  if (resumeData.basics.name) score += 12;
  else missingSections.push("name");

  if (resumeData.basics.headline) score += 10;
  else missingSections.push("headline");

  if (resumeData.basics.email) score += 8;
  else missingSections.push("contact");

  if (resumeData.basics.summary) score += 12;
  else missingSections.push("summary");

  if (resumeData.basics.photoDataUrl) score += 4;

  if (resumeData.experience.length > 0) score += 22;
  else missingSections.push("experience");

  if (resumeData.skills.core.length + resumeData.skills.tools.length + resumeData.skills.languages.length > 0) score += 14;
  else missingSections.push("skills");

  if (resumeData.education.length > 0) score += 10;
  else missingSections.push("education");

  if (resumeData.projects.length > 0) score += 12;
  else missingSections.push("projects");

  return {
    completionScore: Math.min(100, score),
    missingSections,
    isComplete: score >= 78 && resumeData.experience.length > 0 && Boolean(resumeData.basics.summary),
  };
}

export function runFallbackResumeTurn(
  currentResume: ResumeData,
  message: string,
) {
  const next = structuredClone(currentResume);
  const trimmed = message.trim();

  if (!next.basics.name) {
    const [nameLine = "", ...rest] = trimmed.split(/\n|,/);
    next.basics.name = nameLine.trim();
    if (rest[0]) {
      next.basics.headline = rest[0].trim();
    }
  } else if (!next.basics.headline) {
    next.basics.headline = trimmed;
  } else if (!next.basics.email || !next.basics.phone || !next.basics.location) {
    if (!next.basics.email) {
      next.basics.email = extractEmail(trimmed);
    }
    if (!next.basics.phone) {
      next.basics.phone = extractPhone(trimmed);
    }
    if (!next.basics.location) {
      const withoutEmail = trimmed.replace(next.basics.email, "").replace(next.basics.phone, "");
      next.basics.location = withoutEmail.replace(/\s+/g, " ").trim();
    }
  } else if (!next.basics.summary) {
    next.basics.summary = trimmed;
  } else if (next.experience.length === 0) {
    const [roleChunk, ...details] = trimmed.split(/[\n.]/).filter(Boolean);
    const [role = "", company = ""] = roleChunk.split(/ at /i);
    next.experience = [
      {
        role: role.trim(),
        company: company.trim(),
        location: "",
        startDate: "",
        endDate: "",
        achievements: uniqueList(details.flatMap(splitCommaList)),
      },
    ];
  } else if (
    next.skills.core.length + next.skills.tools.length + next.skills.languages.length === 0
  ) {
    next.skills.core = uniqueList(splitCommaList(trimmed));
  } else if (next.projects.length === 0) {
    const [name = "", ...rest] = trimmed.split(/[\n.]/).filter(Boolean);
    const links = extractUrls(trimmed);
    next.projects = [
      {
        name: name.trim(),
        description: rest.join(". ").trim(),
        technologies: [],
        link: links[0] ?? "",
      },
    ];
  } else if (next.education.length === 0) {
    const [school = "", degree = ""] = trimmed.split(/[\n,]/);
    next.education = [
      {
        school: school.trim(),
        degree: degree.trim(),
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
      },
    ];
  } else {
    const links = extractUrls(trimmed);

    if (!next.basics.website && links[0]) {
      next.basics.website = links[0];
    }
    if (!next.basics.linkedin) {
      next.basics.linkedin = links.find((link) => link.includes("linkedin.com")) ?? next.basics.linkedin;
    }
    if (!next.basics.github) {
      next.basics.github = links.find((link) => link.includes("github.com")) ?? next.basics.github;
    }
    if (next.projects[0] && !next.projects[0].link && links[0]) {
      next.projects[0].link = links[0];
    }
  }

  const insights = getCompletionInsights(next);

  return {
    assistantMessage: getFallbackQuestion(next, insights.isComplete),
    resumeData: next,
    ...insights,
  };
}

function getFallbackQuestion(resumeData: ResumeData, isComplete: boolean) {
  if (isComplete) {
    return "Your resume now has enough detail for export. If you want, add refinements like portfolio links, measurable achievements, or another project.";
  }

  if (!resumeData.basics.name || !resumeData.basics.headline) {
    return "What full name and target role should appear at the top of your resume?";
  }

  if (!resumeData.basics.email || !resumeData.basics.phone || !resumeData.basics.location) {
    return "What contact details should I include: email, phone number, and location?";
  }

  if (!resumeData.basics.summary) {
    return "Write a short professional summary describing your strengths, experience level, and the kind of work you do best.";
  }

  if (resumeData.experience.length === 0) {
    return "Tell me about your most relevant job: role, company, dates, and the strongest results or responsibilities.";
  }

  if (resumeData.skills.core.length + resumeData.skills.tools.length + resumeData.skills.languages.length === 0) {
    return "List your key skills, tools, and programming languages separated by commas.";
  }

  if (resumeData.projects.length === 0) {
    return "Tell me about one standout project, including what you built and the tools you used.";
  }

  if (resumeData.education.length === 0) {
    return "What education should appear on the resume: school, degree, field of study, and graduation year?";
  }

  if (!resumeData.basics.photoDataUrl) {
    return "If you want a more premium resume and portfolio, upload a clean JPG headshot now. You can also share portfolio, GitHub, LinkedIn, or project links for interactive previews.";
  }

  return "What would you like to refine next: a stronger summary, more quantified achievements, or additional links?";
}

export function makeFileSafeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "code-port-resume";
}

export function normalizeExternalUrl(value: string) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}
