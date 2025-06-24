import { z } from 'zod';

// ---------- Interfaces (Frontend Types) ----------

export interface PersonalInfo {
  name: string;
  age: string;
  location: string;
  email: string;
  phone: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  gpa?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  organization?: string;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  other?: string;
}

export interface PortfolioData {
  personalInfo: PersonalInfo;
  aboutMe: string;
  education: Education[];
  projects: Project[];
  achievements: Achievement[];
  socialLinks: SocialLinks;
  generatedAt: string;
}

// ---------- Zod Schemas (Backend Validation) ----------

export const PortfolioSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    age: z.string(),
    location: z.string(),
    email: z.string().min(1, "Email is required"),
    phone: z.string(),
  }),
  aboutMe: z.string(),
  education: z.array(
    z.object({
      id: z.string(),
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
      startYear: z.string(),
      endYear: z.string(),
      gpa: z.string().optional(),
    })
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      githubUrl: z.string().url().or(z.literal("")).optional(),
      liveUrl: z.string().url().or(z.literal("")).optional(),
      imageUrl: z.string().url().or(z.literal("")).optional(),
    })
  ),
  achievements: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      date: z.string(),
      organization: z.string().optional(),
    })
  ),
  socialLinks: z.object({
    github: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    website: z.string().optional(),
    other: z.string().optional(),
  }),
  generatedAt: z.string(),
});

// ---------- Type Inference from Zod ----------

export type Portfolio = z.infer<typeof PortfolioSchema>;
