
I have fully planned my system. Do not write any code yet. Read everything carefully first, then wait for my instruction.

---

**PROJECT: TKD OPEN — Taekwondo Tournament Registration Platform**

**Stack:** C# ASP.NET Core Web API (.NET 8), Supabase PostgreSQL, Next.js 14 frontend (already built, do not touch)

---

**ROLES — final:**
```
individual (default, self-registered)
parent (upgraded from individual, self-registered)
club (admin-created, email must be @taekclub.com)
organiser (admin-created, email must be @taekorg.com)
admin
```

**ROLE RULES:**
- Self-registered users default to `individual`
- `individual` can upgrade to `parent` — one way, never back
- `individual` can only have 1 player profile
- `parent` can have unlimited player profiles
- `club` and `organiser` accounts are created by admin only
- `club` and `organiser` must force password change on first login — `force_password_change` lives in `users` table
- Admin creates login accounts for `club`, `organiser` with enforced email domain

---

**USERS TABLE — final:**
```
id — uuid, FK to auth.users
email — text
full_name — text
role — text (individual | parent | club | organiser | admin), default individual
force_password_change — boolean, default false
created_at — timestamptz
updated_at — timestamptz
```

---

**LOOKUP TABLES — all missing, need creating with seed data:**

`belt_ranks` — White, Yellow 1, Yellow 2, Green 1, Green 2, Blue 1, Blue 2, Red 1, Red 2, Black 1, Black 2, Black 3 (already exists ✅)

`genders` — Male, Female (already exists ✅)

`races` — Malay, Chinese, Indian, Others (already exists ✅)

`age_groups` — Super Cadet (9-11), Cadet (12-14), Junior (15-17), Senior (17+)

`weight_classes` — full WT standard table per age group and gender:
```
SUPER CADET Male: Fin ≤20, Fly <23, Bantam <26, Feather <29, Light <32, Welter <36, Middle <40, Heavy >40
SUPER CADET Female: Fin ≤18, Fly <21, Bantam <24, Feather <27, Light <30, Welter <34, Middle <38, Heavy >38
CADET Male: Fin ≤33, Fly 33.1-37, Bantam 37.1-41, Feather 41.1-45, Light 45.1-49, Light Welter 49.1-53, Welter 53.1-57, Light Middle 57.1-61, Middle 61.1-65, Heavy +65
CADET Female: Fin ≤29, Fly 29.1-33, Bantam 33.1-37, Feather 37.1-41, Light 41.1-44, Light Welter 44.1-47, Welter 47.1-51, Light Middle 51.1-55, Middle 55.1-59, Heavy +59
JUNIOR Male: Fin ≤45, Fly 45.1-48, Bantam 48.1-51, Feather 51.1-55, Light 55.1-59, Light Welter 59.1-63, Welter 63.1-68, Light Middle 68.1-73, Middle 73.1-78, Heavy +78
JUNIOR Female: Fin ≤42, Fly 42.1-44, Bantam 44.1-46, Feather 46.1-49, Light 49.1-52, Light Welter 52.1-55, Welter 55.1-59, Light Middle 59.1-63, Middle 63.1-68, Heavy +68
SENIOR Male: Fin ≤54, Fly 54.1-58, Bantam 58.1-63, Feather 63.1-68, Light 68.1-74, Welter 74.1-80, Middle 80.1-87, Heavy +87
SENIOR Female: Fin ≤46, Fly 46.1-49, Bantam 49.1-53, Feather 53.1-57, Light 57.1-62, Welter 62.1-67, Middle 67.1-73, Heavy +73
```

`divisions` — Junior No Head Kick, Professional Head Kick, General

`taegeuks` — Taegeuk 1, Taegeuk 2, Taegeuk 3, Taegeuk 4, Taegeuk 5, Taegeuk 6, Taegeuk 7, Taegeuk 8, Dan 1 , Dan 2, Dan 3, General

`break_types` — Power Breaking, Speed Breaking, Artistic Breaking, General

`kick_types` — Back Kick, Turning Kick, General

`vr_types` — Individual, Team, General

---

**PLAYERS TABLE — replaces `fighters` table:**
```
id — uuid
user_id — uuid, FK to users
full_name — text
ic_number — text (MyKad or passport)
is_foreign — boolean, default false
date_of_birth — date, null for Malaysian (derived from IC by API), required for foreign
gender_id — uuid, FK to genders
race_id — uuid, FK to races
belt_rank_id — uuid, FK to belt_ranks
weight_kg — numeric
height_cm — numeric
club_id — uuid, FK to clubs
age_group — text (calculated and stored by API)
weight_class — text (calculated and stored by API)
created_at — timestamptz
updated_at — timestamptz
```

**PLAYER RULES:**
- `individual` user → max 1 player (enforced by DB trigger AND C# API)
- `parent` user → unlimited players
- For Malaysian (is_foreign = false): API extracts DOB from IC number format YYMMDD-PB-XXXG
- For foreign (is_foreign = true): DOB entered manually, IC field stores passport number
- Age group and weight class calculated by API from DOB + weight + gender, stored on player record

**Age group calculation:**
```
9-11 years → Super Cadet
12-14 years → Cadet
15-17 years → Junior
17+ years → Senior
```

---

**CLUBS TABLE — final:**
```
id — uuid
user_id — uuid, FK to users (the club login account)
name — text
contact_email — text
contact_phone — text
is_active — boolean, default true
created_at — timestamptz
updated_at — timestamptz
```

---

**ORGANISER_PROFILES TABLE — final:**
```
id — uuid
user_id — uuid, FK to users
org_name — text
contact_name — text
contact_email — text
contact_phone — text
logo_url — text, nullable
state — text, nullable
created_at — timestamptz
updated_at — timestamptz
```

---

**TOURNAMENTS TABLE — final:**
```
id — uuid
organiser_id — uuid, FK to users
title — text
description — text, nullable
image — text, nullable
location — text
start_date — timestamptz
end_date — timestamptz
registration_open — timestamptz
registration_close — timestamptz
max_participants — integer
status — text, auto-calculated by API (upcoming | registration_open | registration_close | full | ongoing | completed | cancelled)
created_at — timestamptz
updated_at — timestamptz
```

`entry_fee_min` and `entry_fee_max` are NOT stored — API calculates from competition categories for display only.

---

**TOURNAMENT_CATEGORIES TABLE:**
```
id — uuid
tournament_id — uuid, FK to tournaments
type — text (kyorugi | poomsae | breaking | speed_kicking | vr)
created_at — timestamptz
```

---

**COMPETITION CATEGORY TABLES — separate table per type, all eligibility fields nullable (null = General = no restriction):**

**`kyorugi_categories`:**
```
id, tournament_category_id, name, gender, age_group_id, belt_rank_from_id, belt_rank_to_id, division_id, is_team, team_size, fee_amount, created_at, updated_at
```
Junction: `kyorugi_category_weight_classes` (kyorugi_category_id, weight_class_id)

**`poomsae_categories`:**
```
id, tournament_category_id, name, gender, age_group_id, belt_rank_from_id, belt_rank_to_id, is_team, team_size, fee_amount, created_at, updated_at
```
Junction: `poomsae_category_taegeuks` (poomsae_category_id, taegeuk_id)

**`breaking_categories`:**
```
id, tournament_category_id, name, gender, age_group_id, belt_rank_from_id, belt_rank_to_id, break_type_id, is_team, team_size, fee_amount, created_at, updated_at
```
Junction: `breaking_category_weight_classes` (breaking_category_id, weight_class_id)

**`speed_kicking_categories`:**
```
id, tournament_category_id, name, gender, age_group_id, belt_rank_from_id, belt_rank_to_id, kick_type_id, is_team, team_size, fee_amount, created_at, updated_at
```

**`vr_categories`:**
```
id, tournament_category_id, name, gender, age_group_id, belt_rank_from_id, belt_rank_to_id, vr_type_id, is_team, team_size, fee_amount, created_at, updated_at
```

---

**TOURNAMENT_REGISTRATIONS TABLE — final:**
```
id — uuid
tournament_id — uuid, FK to tournaments
player_id — uuid, FK to players
competition_category_id — uuid
competition_type — text (kyorugi | poomsae | breaking | speed_kicking | vr)
club_id — uuid, FK to clubs
status — text (pending | club_verified | rejected | payment_submitted | approved)
rejection_reason — text, nullable
created_at — timestamptz
updated_at — timestamptz
```

**STATUS FLOW:**
```
pending → club_verified (club confirms player is their member)
pending → rejected (club rejects player)
club_verified → payment_submitted (club uploads receipt)
payment_submitted → approved (AUTO — C# sets this immediately when receipt is uploaded)
```

---

**TEAMS TABLE:**
```
id — uuid
club_id — uuid, FK to clubs
tournament_id — uuid, FK to tournaments
competition_category_id — uuid
competition_type — text
team_name — text
created_at — timestamptz
updated_at — timestamptz
```

**TEAM_MEMBERS TABLE:**
```
id — uuid
team_id — uuid, FK to teams
registration_id — uuid, FK to tournament_registrations
created_at — timestamptz
```

---

**CLUB_PAYMENTS TABLE — receipt record only, no status:**
```
id — uuid
club_id — uuid, FK to clubs
tournament_id — uuid, FK to tournaments
receipt_url — text (Supabase Storage)
total_amount — numeric (calculated by C# at upload time)
uploaded_at — timestamptz
created_at — timestamptz
```

**CLUB PAYMENT RULES:**
- Club can upload multiple receipts for the same tournament
- When receipt is uploaded → C# immediately sets all `payment_submitted` registrations for that club in that tournament → `approved`
- Organiser can only view and download — no approval action

---

**ELIGIBILITY FILTER RULE (C# API):**
When player opens registration, API returns only competition categories where:
```
age_group_id is null OR matches player age_group
gender is null OR matches player gender
belt_rank_from_id is null OR player belt >= belt_rank_from
belt_rank_to_id is null OR player belt <= belt_rank_to
weight_class matches player weight_class (where applicable)
```

---

**WHAT NEEDS TO BE FIXED IN THE EXISTING PROJECT:**

1. **Delete** `fighters` table migration — replace with `players` table
2. **Delete** `player_profiles` from schema.sql — superseded
3. **Delete** `coach_profiles` — coach role removed
4. **Fix** trigger in `000002` — references `public.players` correctly now
5. **Fix** `users` role check — remove `player`, add `individual | parent | club | organiser | admin`
6. **Fix** migration order — `users` table must be created before triggers reference it
7. **Add** all missing lookup tables with seed data
8. **Add** all missing core tables
9. **Update** `Player.cs` C# model — map to `players` table with new columns
10. **Update** `types/index.ts` frontend types — align with final schema
11. **Update** `UserRole` type — remove `player | coach`, add `individual | parent | club`

---

**DO NOT:**
- Touch the frontend pages or components
- Add any packages without asking
- Generate any controllers or services yet
- Change any existing working auth logic

**AFTER reading all of this — tell me what you understood and wait for my go ahead.**

---