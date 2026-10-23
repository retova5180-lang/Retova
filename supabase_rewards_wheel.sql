-- ARS Rewards & Challenges wheel.
-- The frontend calls public.spin_rewards_wheel(); the privileged implementation
-- lives in a non-exposed schema and checks the authenticated user on every call.

INSERT INTO public.wheel_challenges (title, category, reward_xp, image_required)
SELECT seed.title, seed.category, seed.reward_xp, seed.image_required
FROM (VALUES
  ('Share a moment', 'create', 15, false),
  ('Post a photo from your day', 'photo', 25, true),
  ('React to a friend’s story', 'community', 10, false),
  ('Leave a thoughtful comment', 'community', 15, false),
  ('Share a positive thought', 'create', 20, false),
  ('Post a behind-the-scenes moment', 'photo', 30, true),
  ('Discover and follow a new creator', 'discover', 20, false),
  ('Celebrate someone in your community', 'community', 15, false)
) AS seed(title, category, reward_xp, image_required)
WHERE NOT EXISTS (
  SELECT 1 FROM public.wheel_challenges existing WHERE existing.title = seed.title
);

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.spin_rewards_wheel()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_subscriber boolean := false;
  v_used_today integer := 0;
  v_challenge public.wheel_challenges%ROWTYPE;
  v_spin public.wheel_spins%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to spin the ARS wheel.';
  END IF;

  PERFORM 1
  FROM public.users
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Your ARS profile could not be found.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = v_user_id
      AND s.active = true
      AND (s.expires_at IS NULL OR s.expires_at > now())
  )
  INTO v_is_subscriber;

  SELECT count(*)::integer
  INTO v_used_today
  FROM public.wheel_spins ws
  WHERE ws.user_id = v_user_id
    AND ws.spin_date = (now() AT TIME ZONE 'UTC')::date;

  IF NOT v_is_subscriber AND v_used_today >= 2 THEN
    RAISE EXCEPTION 'Your two free spins have been used today. Come back tomorrow or subscribe for unlimited spins.';
  END IF;

  SELECT *
  INTO v_challenge
  FROM public.wheel_challenges
  ORDER BY random()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No challenges are configured for the wheel yet.';
  END IF;

  INSERT INTO public.wheel_spins (
    user_id,
    spin_date,
    attempt_number,
    reward_code,
    reward_payload
  )
  VALUES (
    v_user_id,
    (now() AT TIME ZONE 'UTC')::date,
    v_used_today + 1,
    'challenge',
    jsonb_build_object(
      'challenge_id', v_challenge.id,
      'title', v_challenge.title,
      'category', v_challenge.category,
      'reward_xp', v_challenge.reward_xp,
      'image_required', v_challenge.image_required
    )
  )
  RETURNING * INTO v_spin;

  INSERT INTO public.user_rewards (
    user_id,
    reward_code,
    reward_payload,
    source_spin_id,
    starts_at
  )
  VALUES (
    v_user_id,
    'challenge',
    jsonb_build_object(
      'challenge_id', v_challenge.id,
      'title', v_challenge.title,
      'category', v_challenge.category,
      'reward_xp', v_challenge.reward_xp,
      'image_required', v_challenge.image_required
    ),
    v_spin.id,
    now()
  );

  RETURN jsonb_build_object(
    'spin', to_jsonb(v_spin),
    'challenge', jsonb_build_object(
      'id', v_challenge.id,
      'title', v_challenge.title,
      'category', v_challenge.category,
      'reward_xp', v_challenge.reward_xp,
      'image_required', v_challenge.image_required
    ),
    'is_subscriber', v_is_subscriber,
    'spins_used_today', v_used_today + 1,
    'unlimited_spins', v_is_subscriber
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.spin_rewards_wheel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.spin_rewards_wheel() TO authenticated;

CREATE OR REPLACE FUNCTION public.spin_rewards_wheel()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.spin_rewards_wheel();
$function$;

REVOKE ALL ON FUNCTION public.spin_rewards_wheel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spin_rewards_wheel() TO authenticated;