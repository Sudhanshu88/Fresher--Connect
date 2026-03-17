export type UserRole = "fresher" | "company" | "admin";

export interface SessionUser {
  id?: number;
  user_id?: number;
  role: UserRole;
  db_role?: string;
  name: string;
  email: string;
  is_active?: boolean;
  company_name?: string;
  company_logo?: string;
  company_website?: string;
  company_description?: string;
  company_size?: string;
  industry_type?: string;
  profile_completion?: number;
  verification_status?: string;
  verification_updated_at?: string;
  experience?: string;
  education?: string;
  grad_year?: number;
  skills?: string[];
  resume_url?: string;
  resume_filename?: string;
  resume_parsed_skills?: string[];
  resume_parser_status?: string;
  resume_text_excerpt?: string;
  location?: string;
  phone?: string;
  summary?: string;
  linkedin?: string;
  portfolio?: string;
  created_at?: string;
}

export interface Review {
  id: number;
  name: string;
  role: string;
  rating: number;
  review: string;
  created_at?: string;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  email_status?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export interface Job {
  id: number;
  title: string;
  company_name: string;
  company_logo?: string;
  company_website?: string;
  location?: string;
  department?: string;
  work_mode?: string;
  job_type?: string;
  experience_level?: string;
  degree_required?: string;
  description?: string;
  role_overview?: string;
  benefits?: string;
  categories?: string[];
  required_skills?: string[];
  hiring_stages?: string[];
  salary_min?: number | null;
  salary_max?: number | null;
  salary_range?: string;
  company_description?: string;
  industry_type?: string;
  company_size?: string;
  expiry_date?: string;
  match_score?: number;
  match_label?: string;
  application_count?: number;
  moderation_status?: string;
  is_active?: boolean;
  responsibilities?: string;
  required_qualifications?: string;
  preferred_qualifications?: string;
  application_method?: string;
  application_url?: string;
  application_email?: string;
  posted_date?: string;
  created_at?: string;
  employment_type?: string;
  country?: string;
  state?: string;
  city?: string;
  remote_option?: boolean;
  internship_stipend?: string;
}

export interface Application {
  id: number;
  application_id: number;
  candidate_id?: number;
  user_id?: number;
  company_id?: number;
  status: string;
  applied_at?: string;
  updated_at?: string;
  decision_deadline?: string;
  is_overdue?: boolean;
  interview_at?: string | null;
  decision_reason?: string;
  matched_skills?: string[];
  match_score?: number;
  candidate?: SessionUser;
  job: Job;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
}

export interface CompanyAnalytics {
  open_jobs: number;
  total_jobs: number;
  total_applicants: number;
  shortlisted_rate: number;
  interview_rate: number;
  offer_rate: number;
  rejection_rate: number;
  decision_rate: number;
  avg_decision_hours: number;
  sla_breaches: number;
  top_jobs: Array<{
    job_id: number;
    title: string;
    application_count: number;
    shortlisted_count: number;
    interview_count: number;
    rejected_count: number;
    offer_count: number;
    decision_rate: number;
  }>;
}

export interface AuditEvent {
  id: number;
  action: string;
  summary: string;
  status: string;
  actor_name?: string;
  actor_role?: string;
  target_type?: string;
  target_id?: number | string;
  created_at?: string;
  details?: Record<string, unknown>;
}

export interface UserDashboard {
  ok: boolean;
  user: SessionUser;
  jobs: Job[];
  categories?: string[];
  applications: Application[];
  saved_jobs: Job[];
  notifications: NotificationItem[];
  notification_unread_count: number;
}

export interface CompanyDashboard {
  ok: boolean;
  user: SessionUser;
  posted_jobs: Job[];
  applications: Application[];
  status_counts: Record<string, number>;
  overdue_applications?: number;
  analytics: CompanyAnalytics;
  recent_activity: AuditEvent[];
}

export interface AdminDashboard {
  ok: boolean;
  user: SessionUser;
  analytics: Record<string, number | Record<string, number>>;
  users: SessionUser[];
  jobs: Job[];
  recent_activity: AuditEvent[];
}
