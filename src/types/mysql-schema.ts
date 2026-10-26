// MySQL Relational Database Schema Definitions for SkillBridge

export type UserRole = 'student' | 'recruiter' | 'admin';
export type WorkType = 'Remote' | 'Hybrid' | 'On-site';
export type ExperienceLevel = 'Internship' | 'Entry Level' | 'Mid Level' | 'Senior';
export type SkillImportance = 'Required' | 'Preferred';
export type ApplicationStatus = 'Applied' | 'Reviewing' | 'Interviewing' | 'Accepted' | 'Rejected';

export type SkillCategory = 
  | 'Languages'
  | 'Frontend'
  | 'Backend & APIs'
  | 'Database & Storage'
  | 'Cloud & DevOps'
  | 'Data Science & AI'
  | 'Cybersecurity'
  | 'Tools & Methodologies'
  | 'Soft Skills';

// Table: users
export interface UserRecord {
  id: number;
  email: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

// Table: student_profiles
export interface StudentProfileRecord {
  id: number;
  user_id: number;
  university: string;
  major: string;
  degree: string;
  graduation_year: number;
  gpa: number;
  bio: string;
  target_role: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  updated_at: string;
}

// Table: skills (Master Skills Directory)
export interface SkillRecord {
  id: number;
  name: string;
  category: SkillCategory;
  description: string;
  icon_name?: string;
}

// Table: student_skills (Bridge table between students and skills)
export interface StudentSkillRecord {
  id: number;
  student_id: number;
  skill_id: number;
  proficiency_level: number; // 1 to 5
  years_experience: number;
  verified: boolean;
  notes?: string;
  created_at: string;
}

// Table: job_postings
export interface JobPostingRecord {
  id: number;
  title: string;
  company: string;
  department: string;
  location: string;
  work_type: WorkType;
  experience_level: ExperienceLevel;
  salary_min: number;
  salary_max: number;
  description: string;
  deadline: string;
  posted_at: string;
  logo_bg?: string;
}

// Table: job_required_skills (Bridge table between jobs and required skills)
export interface JobRequiredSkillRecord {
  id: number;
  job_id: number;
  skill_id: number;
  importance: SkillImportance;
  min_proficiency: number; // 1 to 5
  weight: number; // 0.1 to 2.0
}

// Table: career_recommendations
export interface CareerRecommendationRecord {
  id: number;
  student_id: number;
  job_id: number;
  match_percentage: number;
  matched_skills_count: number;
  gap_skills_count: number;
  ai_analysis: string;
  computed_at: string;
}

// Table: job_applications
export interface JobApplicationRecord {
  id: number;
  student_id: number;
  job_id: number;
  match_percentage_at_apply: number;
  status: ApplicationStatus;
  notes?: string;
  applied_at: string;
}

// Joined View Models
export interface EnrichedStudentSkill extends StudentSkillRecord {
  skill_name: string;
  skill_category: SkillCategory;
  skill_description: string;
}

export interface EnrichedJobRequirement extends JobRequiredSkillRecord {
  skill_name: string;
  skill_category: SkillCategory;
  student_has_skill: boolean;
  student_proficiency: number;
  is_satisfied: boolean;
}

export interface RecommendationMatchResult {
  job: JobPostingRecord;
  matchPercentage: number;
  matchedSkills: {
    skill: SkillRecord;
    studentProficiency: number;
    requiredProficiency: number;
    importance: SkillImportance;
    isProficientEnough: boolean;
  }[];
  gapSkills: {
    skill: SkillRecord;
    requiredProficiency: number;
    importance: SkillImportance;
    estimatedBridgeTimeWeeks: number;
    priority: 'Critical' | 'Recommended' | 'Bonus';
  }[];
  careerTrackAlignment: number; // 0-100%
  recommendationReason: string;
  isApplied: boolean;
  applicationStatus?: ApplicationStatus;
}
