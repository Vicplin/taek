// ─── User Roles ──────────────────────────────────────────────────────────────
export type UserRole = 'player' | 'coach' | 'organiser' | 'admin'

// ─── Core User ───────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  role: UserRole
  full_name?: string
  created_at?: string
}

// ─── Player Profile ───────────────────────────────────────────────────────────
export interface PlayerProfile {
  id: string
  user_id: string
  club_id?: string
  date_of_birth?: string
  gender?: string
  weight_kg?: number
  height_cm?: number
  ic_number?: string
  nationality?: string
  phone?: string
  belt_rank?: string
  state?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  avatar_url?: string
}

export interface BeltHistoryEntry {
  id: string
  player_id: string
  belt_color: string
  awarded_at: string
  awarded_by?: string
}

export interface WeightHistoryEntry {
  id: string
  player_id: string
  weight_kg: number
  recorded_at: string
}

// ─── Coach Profile ────────────────────────────────────────────────────────────
export interface CoachProfile {
  id: string
  user_id: string
  club_id?: string
  certification_level?: string
  licence_no?: string
  belt_rank?: string
  affiliated_club_id?: string
  state?: string
  phone?: string
  avatar_url?: string
  verified: boolean
}

export interface CoachRosterEntry {
  id: string
  coach_user_id: string
  player_user_id: string
  status: 'pending' | 'accepted' | 'declined' | 'removed'
  invited_at: string
  responded_at?: string
}

// ─── Organiser Profile ────────────────────────────────────────────────────────
export interface OrganiserProfile {
  id: string
  user_id: string
  org_name: string
  logo_url?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  state?: string
  verification_status: 'pending' | 'verified' | 'rejected'
}

// ─── Event ───────────────────────────────────────────────────────────────────
export type EventStatus = 'draft' | 'open' | 'closed' | 'completed'

export interface Event {
  id: string
  title: string
  organiser_id: string
  venue: string
  start_date: string
  end_date: string
  registration_open: string
  registration_close: string
  status: EventStatus
  created_at: string
}

// ─── Event Category ───────────────────────────────────────────────────────────
export type BeltRank = string;

export interface EventCategory {
  id: string
  event_id: string
  name: string
  gender: 'male' | 'female' | 'mixed'
  min_age: number
  max_age: number
  belt_from: BeltRank
  belt_to: BeltRank
}

// ─── Registration ─────────────────────────────────────────────────────────────
export type RegistrationStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'pending_payment'
  | 'receipt_uploaded'
  | 'confirmed'

export interface Registration {
  id: string
  player_id: string
  event_id: string
  category_id: string
  weight_class_id: string
  status: RegistrationStatus
  created_at: string
}
