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
  githubUrl?: string | null;
  liveUrl?: string | null;
  imageUrl?: string | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  organization?: string;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
  twitter: string;
  website: string;
  other: string;
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
