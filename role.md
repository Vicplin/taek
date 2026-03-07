
**Implement the complete role system for the Taek app. Architecture is Frontend → API → Database. Follow every instruction exactly.**

---

### 1. Database — Triggers as Safety Net Only

Run these in Supabase SQL editor:

```sql
-- Auto assign individual role on signup
CREATE OR REPLACE FUNCTION assign_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'individual')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_role_on_signup();

-- Prevent role downgrade
CREATE OR REPLACE FUNCTION prevent_role_downgrade()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'parent' AND NEW.role = 'individual' THEN
    RAISE EXCEPTION 'Cannot downgrade from parent to individual.';
  END IF;
  IF OLD.role IN ('admin', 'coach', 'organiser') AND NEW.role != OLD.role THEN
    RAISE EXCEPTION 'Staff roles cannot be changed via the app.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_role_rules
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_downgrade();

-- Enforce individual player limit
CREATE OR REPLACE FUNCTION check_individual_player_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT role FROM public.users WHERE id = NEW.user_id) = 'individual' THEN
    IF (SELECT COUNT(*) FROM public.players WHERE user_id = NEW.user_id) >= 1 THEN
      RAISE EXCEPTION 'Individual accounts can only have 1 player.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_individual_player_limit
  BEFORE INSERT ON public.players
  FOR EACH ROW EXECUTE FUNCTION check_individual_player_limit();
```

---

### 2. API — Auth Endpoints

#### `POST /api/auth/register`
- Accept `{ email, password, fullName }`
- Reject if email ends with `@taekadmin.com`, `@taekclub.com`, `@taekorg.com`:
```csharp
var restrictedDomains = new[] { "@taekadmin.com", "@taekclub.com", "@taekorg.com" };
if (restrictedDomains.Any(d => request.Email.EndsWith(d, StringComparison.OrdinalIgnoreCase)))
    return BadRequest("This email domain is not available for public registration.");
```
- Create auth user in Supabase
- DB trigger automatically sets `role = 'individual'`
- Return success

#### `POST /api/auth/login`
- Accept `{ email, password }`
- Authenticate with Supabase
- Query `public.users` for role
- Reject if role is `admin`, `coach`, or `organiser` with: `"Please use the staff login page."`
- Return JWT with role claim

#### `POST /api/auth/staff-login`
- Accept `{ email, password }`
- Authenticate with Supabase
- Query `public.users` for role
- Reject if role is `individual` or `parent` with: `"You do not have staff access."`
- Return JWT with role claim
- Frontend redirects based on role:
  - `admin` → `/admin/dashboard`
  - `coach` → `/coach/dashboard`
  - `organiser` → `/organiser/dashboard`

---

### 3. API — User Endpoints

#### `GET /api/users/me`
- Protected endpoint, requires valid JWT
- Query `public.users` for `{ id, email, role }`
- Return the result

#### `PATCH /api/users/upgrade-to-parent`
- Protected endpoint, requires valid JWT
- Query current role from `public.users`
- Reject if current role is NOT `individual`:
```csharp
if (existingUser.Role != "individual")
    return BadRequest("Only individual accounts can be upgraded to parent.");
```
- Update `public.users` set `role = 'parent'`
- Return success

---

### 4. API — Admin Endpoints

#### `POST /api/admin/create-staff`
- Protected by `[Authorize(Roles = "admin")]`
- Accept `{ email, password, fullName, role }`
- Validate role is strictly `coach` or `organiser`:
```csharp
if (request.Role != "coach" && request.Role != "organiser")
    return BadRequest("Invalid role. Only coach or organiser allowed.");
```
- Create auth user via Supabase Admin API (service role key, server-side only)
- Insert into `public.users` with correct role
- Return success

---

### 5. Frontend — Signup Page
- Form fields: Full Name, Email, Password
- On submit call `POST /api/auth/register`
- Display API error messages directly (domain rejection etc.)
- On success redirect to `/dashboard`

---

### 6. Frontend — Login Page
- Form fields: Email, Password
- On submit call `POST /api/auth/login`
- Display API error messages directly
- On success redirect to `/dashboard`

---

### 7. Frontend — Staff Login Page (existing `/staff-login`)
- Form fields: Email, Password
- On submit call `POST /api/auth/staff-login`
- Display API error messages directly
- On success redirect based on role returned:
  - `admin` → `/admin/dashboard`
  - `coach` → `/coach/dashboard`
  - `organiser` → `/organiser/dashboard`

---

### 8. Frontend — Dashboard
- On mount call `GET /api/users/me`
- Store role in state
- Render UI based on role:
  - `individual` → show single player profile + "Upgrade to Parent Account" button
  - `parent` → show player management with ability to add multiple players
- Remove all references to `user_metadata.is_parent` entirely

---

### 9. Frontend — Parent Upgrade Flow
- "Upgrade to Parent Account" button only visible if `role === 'individual'`
- On click show confirmation modal:
  > *"This cannot be undone. You will not be able to switch back to an Individual account. Are you sure?"*
- On confirm call `PATCH /api/users/upgrade-to-parent`
- On success refresh role state from `GET /api/users/me`
- Hide button permanently once role is `parent`

---

### 10. Frontend — Admin Panel (new protected page `/admin/dashboard`)
- Only accessible if role is `admin`
- Include a "Create Staff Account" form:
  - Fields: Full Name, Email, Password, Role (dropdown: Coach / Organiser)
  - On submit call `POST /api/admin/create-staff`
  - Show success/error message

---

**Rules:**
- Frontend never writes role directly to Supabase
- Frontend never reads role from `user_metadata`
- All role logic lives in the API
- DB triggers are backup safety net only
- All 10 points must be fully implemented, nothing skipped

---
