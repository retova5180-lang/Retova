-- ARS streak lifecycle, daily interaction tracking, and shared monthly recovery.
-- All privileged helpers live in the non-exposed private schema and validate auth.uid().

ALTER TABLE public.streaks
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS setup_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS setup_days_completed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_user_a date,
  ADD COLUMN IF NOT EXISTS last_activity_user_b date,
  ADD COLUMN IF NOT EXISTS last_counted_date date,
  ADD COLUMN IF NOT EXISTS broken_at timestamptz,
  ADD COLUMN IF NOT EXISTS recovery_grace_date date;

ALTER TABLE public.streaks
  DROP CONSTRAINT IF EXISTS streaks_status_check;
ALTER TABLE public.streaks
  ADD CONSTRAINT streaks_status_check CHECK (status IN ('setup', 'active', 'broken'));
ALTER TABLE public.streaks
  DROP CONSTRAINT IF EXISTS streaks_setup_days_completed_check;
ALTER TABLE public.streaks
  ADD CONSTRAINT streaks_setup_days_completed_check CHECK (setup_days_completed BETWEEN 0 AND 3);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS streaks_unique_user_pair_idx
  ON public.streaks (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));

CREATE UNIQUE INDEX IF NOT EXISTS streak_invites_one_pending_pair_idx
  ON public.streak_invites (from_user_id, to_user_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS streak_activities_daily_type_unique_idx
  ON public.streak_activities (streak_id, actor_id, activity_date, activity_type);

CREATE INDEX IF NOT EXISTS streaks_status_activity_idx
  ON public.streaks (status, last_activity_user_a, last_activity_user_b);

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.mark_streak_broken(p_streak_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_streak public.streaks%ROWTYPE;
  v_used integer := 0;
  v_remaining integer := 3;
  v_month date := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
BEGIN
  UPDATE public.streaks
  SET status = 'broken',
      broken_at = now(),
      updated_at = now()
  WHERE id = p_streak_id
    AND status = 'active'
  RETURNING * INTO v_streak;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT count(*)::integer
  INTO v_used
  FROM public.streak_restores
  WHERE streak_id = v_streak.id
    AND restore_month = v_month;

  v_remaining := greatest(0, 3 - v_used);

  INSERT INTO public.notifications (user_id, sender_id, type, metadata)
  VALUES
    (
      v_streak.user_a_id,
      v_streak.user_b_id,
      'streak_broken',
      jsonb_build_object(
        'streak_id', v_streak.id,
        'streak_count', v_streak.streak_count,
        'remaining_attempts', v_remaining,
        'month', v_month
      )
    ),
    (
      v_streak.user_b_id,
      v_streak.user_a_id,
      'streak_broken',
      jsonb_build_object(
        'streak_id', v_streak.id,
        'streak_count', v_streak.streak_count,
        'remaining_attempts', v_remaining,
        'month', v_month
      )
    );

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION private.record_streak_activity(
  p_streak_id uuid,
  p_actor_id uuid,
  p_activity_type text,
  p_source_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_streak public.streaks%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_day_offset integer;
  v_setup_days integer := 0;
BEGIN
  IF p_activity_type NOT IN ('like', 'story_view') THEN
    RETURN;
  END IF;

  SELECT *
  INTO v_streak
  FROM public.streaks
  WHERE id = p_streak_id
  FOR UPDATE;

  IF NOT FOUND OR v_streak.status NOT IN ('setup', 'active') THEN
    RETURN;
  END IF;

  IF v_streak.status = 'active'
    AND v_streak.recovery_grace_date IS DISTINCT FROM v_today
    AND (
      v_streak.last_activity_user_a IS NULL
      OR v_streak.last_activity_user_b IS NULL
      OR v_streak.last_activity_user_a < v_today - 1
      OR v_streak.last_activity_user_b < v_today - 1
    )
  THEN
    PERFORM private.mark_streak_broken(v_streak.id);
    RETURN;
  END IF;

  INSERT INTO public.streak_activities (
    streak_id, actor_id, activity_date, activity_type, source_id
  )
  VALUES (v_streak.id, p_actor_id, v_today, p_activity_type, p_source_id)
  ON CONFLICT (streak_id, actor_id, activity_date, activity_type) DO NOTHING;

  IF p_actor_id = v_streak.user_a_id THEN
    UPDATE public.streaks
    SET last_activity_user_a = v_today,
        last_activity_at = now(),
        updated_at = now()
    WHERE id = v_streak.id;
  ELSIF p_actor_id = v_streak.user_b_id THEN
    UPDATE public.streaks
    SET last_activity_user_b = v_today,
        last_activity_at = now(),
        updated_at = now()
    WHERE id = v_streak.id;
  ELSE
    RETURN;
  END IF;

  IF v_streak.status = 'setup' THEN
    SELECT least(
      (
        SELECT count(DISTINCT activity_date)::integer
        FROM public.streak_activities
        WHERE streak_id = v_streak.id
          AND actor_id = v_streak.user_a_id
          AND activity_type IN ('like', 'story_view')
          AND activity_date >= (v_streak.setup_started_at AT TIME ZONE 'UTC')::date
      ),
      (
        SELECT count(DISTINCT activity_date)::integer
        FROM public.streak_activities
        WHERE streak_id = v_streak.id
          AND actor_id = v_streak.user_b_id
          AND activity_type IN ('like', 'story_view')
          AND activity_date >= (v_streak.setup_started_at AT TIME ZONE 'UTC')::date
      )
    )
    INTO v_setup_days;

    UPDATE public.streaks
    SET setup_days_completed = least(v_setup_days, 3)
    WHERE id = v_streak.id;

    FOR v_day_offset IN 0..2 LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM public.streak_activities
        WHERE streak_id = v_streak.id
          AND actor_id = v_streak.user_a_id
          AND activity_type IN ('like', 'story_view')
          AND activity_date = v_today - v_day_offset
          AND activity_date >= (v_streak.setup_started_at AT TIME ZONE 'UTC')::date
      ) OR NOT EXISTS (
        SELECT 1
        FROM public.streak_activities
        WHERE streak_id = v_streak.id
          AND actor_id = v_streak.user_b_id
          AND activity_type IN ('like', 'story_view')
          AND activity_date = v_today - v_day_offset
          AND activity_date >= (v_streak.setup_started_at AT TIME ZONE 'UTC')::date
      ) THEN
        RETURN;
      END IF;
    END LOOP;

    UPDATE public.streaks
    SET status = 'active',
        streak_count = 3,
        setup_days_completed = 3,
        last_activity_user_a = v_today,
        last_activity_user_b = v_today,
        last_counted_date = v_today,
        last_activity_at = now(),
        updated_at = now()
    WHERE id = v_streak.id;

    INSERT INTO public.notifications (user_id, sender_id, type, metadata)
    VALUES
      (v_streak.user_a_id, v_streak.user_b_id, 'streak_started',
        jsonb_build_object('streak_id', v_streak.id, 'streak_count', 3)),
      (v_streak.user_b_id, v_streak.user_a_id, 'streak_started',
        jsonb_build_object('streak_id', v_streak.id, 'streak_count', 3));
    RETURN;
  END IF;

  SELECT *
  INTO v_streak
  FROM public.streaks
  WHERE id = p_streak_id;

  IF v_streak.status = 'active'
    AND v_streak.last_activity_user_a = v_today
    AND v_streak.last_activity_user_b = v_today
    AND v_streak.last_counted_date IS DISTINCT FROM v_today
  THEN
    UPDATE public.streaks
    SET streak_count = streak_count + 1,
        last_counted_date = v_today,
        updated_at = now()
    WHERE id = v_streak.id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION private.track_social_streak_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor_id uuid;
  v_owner_id uuid;
  v_source_id uuid;
  v_activity_type text;
  v_streak record;
BEGIN
  IF TG_TABLE_NAME = 'likes' THEN
    v_actor_id := NEW.user_id;
    v_source_id := NEW.post_id;
    v_activity_type := 'like';
    SELECT p.user_id INTO v_owner_id
    FROM public.posts p
    WHERE p.id = NEW.post_id;
  ELSIF TG_TABLE_NAME = 'story_views' THEN
    v_actor_id := NEW.viewer_id;
    v_source_id := NEW.story_id;
    v_activity_type := 'story_view';
    SELECT s.user_id INTO v_owner_id
    FROM public.stories s
    WHERE s.id = NEW.story_id;
  ELSE
    RETURN NEW;
  END IF;

  IF v_actor_id IS NULL OR v_owner_id IS NULL OR v_actor_id = v_owner_id THEN
    RETURN NEW;
  END IF;

  FOR v_streak IN
    SELECT s.id
    FROM public.streaks s
    WHERE s.status IN ('setup', 'active')
      AND (
        (s.user_a_id = v_actor_id AND s.user_b_id = v_owner_id)
        OR (s.user_b_id = v_actor_id AND s.user_a_id = v_owner_id)
      )
  LOOP
    PERFORM private.record_streak_activity(
      v_streak.id, v_actor_id, v_activity_type, v_source_id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION private.send_streak_invite(p_to_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_from_id uuid := auth.uid();
  v_to_id uuid;
  v_username text := lower(trim(coalesce(p_to_username, '')));
  v_invite public.streak_invites%ROWTYPE;
BEGIN
  IF v_from_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to invite someone to a streak.';
  END IF;
  IF v_username = '' THEN
    RAISE EXCEPTION 'Enter the username of the person you want to invite.';
  END IF;

  SELECT u.id INTO v_to_id
  FROM public.users u
  WHERE lower(u.username) = v_username
  LIMIT 1;

  IF v_to_id IS NULL THEN
    RAISE EXCEPTION 'No ARS account was found with that username.';
  END IF;
  IF v_to_id = v_from_id THEN
    RAISE EXCEPTION 'You cannot invite yourself to a streak.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = v_from_id AND b.blocked_id = v_to_id)
       OR (b.blocker_id = v_to_id AND b.blocked_id = v_from_id)
  ) THEN
    RAISE EXCEPTION 'A streak invitation cannot be sent for this connection.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.streaks s
    WHERE LEAST(s.user_a_id, s.user_b_id) = LEAST(v_from_id, v_to_id)
      AND GREATEST(s.user_a_id, s.user_b_id) = GREATEST(v_from_id, v_to_id)
  ) THEN
    RAISE EXCEPTION 'A streak already exists for this connection. Open Streaks to view or recover it.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.streak_invites i
    WHERE i.from_user_id = v_to_id
      AND i.to_user_id = v_from_id
      AND i.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'This person has already invited you. Check your received invitations.';
  END IF;

  INSERT INTO public.streak_invites (from_user_id, to_user_id, status)
  VALUES (v_from_id, v_to_id, 'pending')
  RETURNING * INTO v_invite;

  INSERT INTO public.notifications (user_id, sender_id, type, metadata)
  VALUES (
    v_to_id,
    v_from_id,
    'streak_invite',
    jsonb_build_object('invite_id', v_invite.id)
  );

  RETURN jsonb_build_object(
    'id', v_invite.id,
    'from_user_id', v_invite.from_user_id,
    'to_user_id', v_invite.to_user_id,
    'status', v_invite.status,
    'created_at', v_invite.created_at
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.respond_streak_invite(
  p_invite_id uuid,
  p_response text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_invite public.streak_invites%ROWTYPE;
  v_streak public.streaks%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to respond to a streak invitation.';
  END IF;
  IF p_response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Choose accept or decline.';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.streak_invites
  WHERE id = p_invite_id
    AND to_user_id = v_user_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invitation is no longer pending or does not belong to you.';
  END IF;

  IF p_response = 'accepted' AND EXISTS (
    SELECT 1
    FROM public.streaks s
    WHERE LEAST(s.user_a_id, s.user_b_id) = LEAST(v_invite.from_user_id, v_invite.to_user_id)
      AND GREATEST(s.user_a_id, s.user_b_id) = GREATEST(v_invite.from_user_id, v_invite.to_user_id)
  ) THEN
    RAISE EXCEPTION 'A streak already exists for this connection.';
  END IF;

  UPDATE public.streak_invites
  SET status = p_response,
      responded_at = now()
  WHERE id = v_invite.id;

  IF p_response = 'accepted' THEN
    INSERT INTO public.streaks (
      user_a_id, user_b_id, streak_count, status, setup_started_at,
      setup_days_completed, last_activity_at
    )
    VALUES (
      LEAST(v_invite.from_user_id, v_invite.to_user_id),
      GREATEST(v_invite.from_user_id, v_invite.to_user_id),
      0, 'setup', now(), 0, now()
    )
    RETURNING * INTO v_streak;

    INSERT INTO public.notifications (user_id, sender_id, type, metadata)
    VALUES (
      v_invite.from_user_id,
      v_invite.to_user_id,
      'streak_invite_accepted',
      jsonb_build_object('invite_id', v_invite.id, 'streak_id', v_streak.id)
    );
  ELSE
    INSERT INTO public.notifications (user_id, sender_id, type, metadata)
    VALUES (
      v_invite.from_user_id,
      v_invite.to_user_id,
      'streak_invite_declined',
      jsonb_build_object('invite_id', v_invite.id)
    );
  END IF;

  RETURN jsonb_build_object(
    'invite_id', v_invite.id,
    'status', p_response,
    'streak_id', v_streak.id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.recover_streak(p_streak_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_streak public.streaks%ROWTYPE;
  v_month date := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
  v_used integer := 0;
  v_remaining integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to recover a streak.';
  END IF;

  SELECT *
  INTO v_streak
  FROM public.streaks
  WHERE id = p_streak_id
    AND (user_a_id = v_user_id OR user_b_id = v_user_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Streak not found for your account.';
  END IF;
  IF v_streak.status <> 'broken' THEN
    RAISE EXCEPTION 'Only a broken streak can be recovered.';
  END IF;

  SELECT count(*)::integer
  INTO v_used
  FROM public.streak_restores
  WHERE streak_id = v_streak.id
    AND restore_month = v_month;

  IF v_used >= 3 THEN
    RAISE EXCEPTION 'All three shared recovery attempts have been used this month.';
  END IF;

  INSERT INTO public.streak_restores (
    streak_id, used_by, restore_month, previous_streak_count
  )
  VALUES (
    v_streak.id, v_user_id, v_month, v_streak.streak_count
  );

  v_used := v_used + 1;
  v_remaining := greatest(0, 3 - v_used);

  UPDATE public.streaks
  SET status = 'active',
      broken_at = NULL,
      recovery_grace_date = (now() AT TIME ZONE 'UTC')::date,
      last_activity_user_a = (now() AT TIME ZONE 'UTC')::date,
      last_activity_user_b = (now() AT TIME ZONE 'UTC')::date,
      last_counted_date = (now() AT TIME ZONE 'UTC')::date,
      last_activity_at = now(),
      updated_at = now()
  WHERE id = v_streak.id;

  INSERT INTO public.notifications (user_id, sender_id, type, metadata)
  VALUES
    (v_streak.user_a_id, CASE WHEN v_user_id = v_streak.user_a_id THEN v_streak.user_b_id ELSE v_streak.user_a_id END,
      'streak_restored', jsonb_build_object('streak_id', v_streak.id, 'remaining_attempts', v_remaining, 'streak_count', v_streak.streak_count)),
    (v_streak.user_b_id, CASE WHEN v_user_id = v_streak.user_b_id THEN v_streak.user_a_id ELSE v_streak.user_b_id END,
      'streak_restored', jsonb_build_object('streak_id', v_streak.id, 'remaining_attempts', v_remaining, 'streak_count', v_streak.streak_count));

  RETURN jsonb_build_object(
    'streak_id', v_streak.id,
    'streak_count', v_streak.streak_count,
    'remaining_attempts', v_remaining,
    'restore_month', v_month
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.refresh_streak_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_streak record;
  v_broken_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to load streaks.';
  END IF;

  FOR v_streak IN
    SELECT s.id
    FROM public.streaks s
    WHERE s.status = 'active'
      AND (s.user_a_id = v_user_id OR s.user_b_id = v_user_id)
      AND s.recovery_grace_date IS DISTINCT FROM (now() AT TIME ZONE 'UTC')::date
      AND (
        s.last_activity_user_a IS NULL
        OR s.last_activity_user_b IS NULL
        OR s.last_activity_user_a < (now() AT TIME ZONE 'UTC')::date - 1
        OR s.last_activity_user_b < (now() AT TIME ZONE 'UTC')::date - 1
      )
  LOOP
    IF private.mark_streak_broken(v_streak.id) THEN
      v_broken_count := v_broken_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('broken_count', v_broken_count);
END;
$function$;

REVOKE ALL ON FUNCTION private.mark_streak_broken(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.record_streak_activity(uuid, uuid, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.track_social_streak_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.send_streak_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.respond_streak_invite(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.recover_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.refresh_streak_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.send_streak_invite(p_to_username text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.send_streak_invite(p_to_username);
$function$;

CREATE OR REPLACE FUNCTION public.respond_streak_invite(p_invite_id uuid, p_response text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.respond_streak_invite(p_invite_id, p_response);
$function$;

CREATE OR REPLACE FUNCTION public.recover_streak(p_streak_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.recover_streak(p_streak_id);
$function$;

CREATE OR REPLACE FUNCTION public.refresh_streak_status()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.refresh_streak_status();
$function$;

REVOKE ALL ON FUNCTION public.send_streak_invite(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_streak_invite(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recover_streak(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refresh_streak_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_streak_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_streak_invite(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recover_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_streak_status() TO authenticated;

DROP TRIGGER IF EXISTS likes_track_streak_activity ON public.likes;
CREATE TRIGGER likes_track_streak_activity
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION private.track_social_streak_activity();

DROP TRIGGER IF EXISTS story_views_track_streak_activity ON public.story_views;
CREATE TRIGGER story_views_track_streak_activity
AFTER INSERT ON public.story_views
FOR EACH ROW EXECUTE FUNCTION private.track_social_streak_activity();

-- Trigger-only functions do not need direct RPC execute grants.
REVOKE ALL ON FUNCTION public.sync_post_engagement_counts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_story_viewer_count() FROM PUBLIC, anon, authenticated;