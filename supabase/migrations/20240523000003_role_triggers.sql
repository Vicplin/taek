-- Auto assign individual role on signup
CREATE OR REPLACE FUNCTION assign_role_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  default_role text;
BEGIN
  -- Use metadata role if provided, but restrict to safe defaults (individual/parent)
  -- Admin/Organiser/Club roles must be set manually by an admin after creation or via a secure process
  -- This prevents users from self-assigning privileged roles via public signup
  default_role := COALESCE(NEW.raw_user_meta_data->>'role', 'individual');
  
  IF default_role NOT IN ('individual', 'parent') THEN
    default_role := 'individual';
  END IF;

  INSERT INTO public.users (id, email, role, full_name, phone)
  VALUES (
    NEW.id, 
    NEW.email, 
    default_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_role_on_signup();

-- Prevent role downgrade
CREATE OR REPLACE FUNCTION prevent_role_downgrade()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent self-assigning privileged roles
  IF NEW.role IN ('admin', 'organiser', 'club') AND OLD.role IN ('individual', 'parent') THEN
    RAISE EXCEPTION 'Cannot self-assign privileged roles.';
  END IF;

  -- Individual to Parent is allowed (upgrade). Parent to Individual is blocked (downgrade).
  IF OLD.role = 'parent' AND NEW.role = 'individual' THEN
    RAISE EXCEPTION 'Cannot downgrade from parent to individual.';
  END IF;
  
  -- Staff roles are sticky and managed by admin only
  IF OLD.role IN ('admin', 'club', 'organiser') AND NEW.role != OLD.role THEN
    RAISE EXCEPTION 'Staff/Club roles cannot be changed via the app.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_role_rules ON public.users;
CREATE TRIGGER enforce_role_rules
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_downgrade();

-- Enforce individual player limit
CREATE OR REPLACE FUNCTION check_individual_player_limit()
RETURNS TRIGGER AS $$
DECLARE
  player_count integer;
BEGIN
  -- Check user role first
  IF (SELECT role FROM public.users WHERE id = NEW.user_id) = 'individual' THEN
    SELECT COUNT(*) INTO player_count FROM public.players WHERE user_id = NEW.user_id;
    
    IF player_count >= 1 THEN
      -- Use a consistent error code format: ERR_LIMIT_REACHED: <message>
      RAISE EXCEPTION 'ERR_LIMIT_REACHED: Individual accounts can only have 1 player.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_individual_player_limit ON public.players;
CREATE TRIGGER enforce_individual_player_limit
  BEFORE INSERT ON public.players
  FOR EACH ROW EXECUTE FUNCTION check_individual_player_limit();
