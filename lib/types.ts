import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1),
  timestamp: z.string().optional(),
});

export const experienceSchema = z.object({
  company: z.string().default(""),
  role: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  achievements: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  school: z.string().default(""),
  degree: z.string().default(""),
  fieldOfStudy: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
});

export const projectSchema = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  technologies: z.array(z.string()).default([]),
  link: z.string().default(""),
});

export const resumeDataSchema = z.object({
  basics: z.object({
    name: z.string().default(""),
    headline: z.string().default(""),
    photoDataUrl: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    summary: z.string().default(""),
    website: z.string().default(""),
    linkedin: z.string().default(""),
    github: z.string().default(""),
  }),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.object({
    core: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
  }),
  projects: z.array(projectSchema).default([]),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1),
  messages: z.array(chatMessageSchema).min(1),
  resumeData: resumeDataSchema,
});

export const chatResponseSchema = z.object({
  assistantMessage: z.string(),
  resumeData: resumeDataSchema,
  isComplete: z.boolean(),
  completionScore: z.number().min(0).max(100),
  missingSections: z.array(z.string()),
});

export const storedProjectSchema = z.object({
  id: z.string().min(1),
  resumeData: resumeDataSchema,
  conversation: z.array(chatMessageSchema),
  portfolioReady: z.boolean().default(false),
  updatedAt: z.string(),
});

export const pdfRequestSchema = z.object({
  resumeData: resumeDataSchema,
  fileName: z.string().min(1),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ResumeData = z.infer<typeof resumeDataSchema>;
export type StoredProject = z.infer<typeof storedProjectSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
