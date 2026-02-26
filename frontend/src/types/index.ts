// ─── User Roles ──────────────────────────────────────────────────────────────
export type UserRole = 'player' | 'coach' | 'organiser' | 'admin'

// ─── Core User ───────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string
  ic_number?: string
  dob?: string
  gender?: 'male' | 'female'
  phone?: string
  created_at: string
}

// ─── Player Profile ───────────────────────────────────────────────────────────
export type BeltRank =
  | 'white' | 'yellow' | 'orange' | 'green'
  | 'blue' | 'red' | 'black_1dan' | 'black_2dan'
  | 'black_3dan' | 'black_4dan' | 'black_5dan'

export interface PlayerProfile {
  id: string
  user_id: string
  belt_rank: BeltRank
  weight_kg: number
  club_id?: string
  state: string
  country: string
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
