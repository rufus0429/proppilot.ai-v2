export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  preferred_area?: string;
  property_type?: string;
  bedrooms?: number;
  timeline?: string;
  financing_required: boolean;
  intent?: string;
  source: string;
  lead_score: number;
  priority: string;
  status: string;
  current_stage: string;
  workflow_status: string;
  is_duplicate: boolean;
  assigned_to?: string;
  assigned_to_user?: User;
  created_at: string;
  updated_at?: string;
  qualified_at?: string;
  last_contacted_at?: string;
  customer_responded_at?: string;
  whatsapp_status?: string;
  email_status?: string;
  whatsapp_sent_at?: string;
  email_sent_at?: string;
  last_followup_at?: string;
  followup_retry_count?: number;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  size: number;
}

export interface PropertyInquiryForm {
  property_type: string;
  city: string;
  area?: string;
  budget_min?: number;
  budget_max?: number;
  bedrooms?: number;
  timeline: string;
  financing_required: boolean;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  source: string;
}

export interface InquirySubmitResponse {
  success: boolean;
  message: string;
  lead_id?: string;
  recommendations?: PropertyRecommendation[];
  whatsapp_url?: string;
  whatsapp_message?: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  address?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  property_type: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  is_active: boolean;
  is_featured: boolean;
  builder_name?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  lead_id: string;
  property_id?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  appointment_type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface FollowUpStep {
  id: string;
  sequence_id: string;
  step_order: number;
  channel: string;
  message_content?: string;
  delay_hours: number;
  delay_days: number;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
}

export interface FollowUpSequence {
  id: string;
  lead_id: string;
  name?: string;
  status: string;
  current_step: number;
  total_steps: number;
  started_at: string;
  completed_at?: string;
  steps: FollowUpStep[];
}

export interface Activity {
  id: string;
  lead_id: string;
  user_id?: string;
  activity_type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface JourneyStep {
  channel: string;
  message: string;
  delay_days: number;
  delay_hours: number;
}

export interface DashboardStats {
  today_leads: number;
  total_leads: number;
  active_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  pending_followups: number;
  whatsapp_sent: number;
  emails_sent: number;
  upcoming_site_visits: number;
  completed_visits: number;
  bookings: number;
  conversion_rate: number;
  leads_by_source: { source: string; count: number }[];
  leads_by_stage: { stage: string; count: number }[];
  recent_activities: { id: string; lead_id: string; lead_name?: string; activity_type: string; title: string; created_at: string }[];
  ai_insights?: { total_leads_today: number; hot_leads_pending: number; pending_followups: number; upcoming_visits: number };
}

export interface LeadQualificationResult {
  name?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  property_type?: string;
  timeline?: string;
  financing_required: boolean;
  intent?: string;
}

export interface LeadScoringResult {
  score: number;
  priority: string;
  explanation: string;
}

export interface PropertyRecommendation {
  property_id: string;
  property_name?: string;
  location?: string;
  price?: number;
  match_score: number;
  reason: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
