-- Correct trigger return behavior for story view inserts, updates and deletes.
CREATE OR REPLACE FUNCTION public.refresh_story_viewer_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_story_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_story_id := OLD.story_id;
  ELSE
    target_story_id := NEW.story_id;
  END IF;

  UPDATE public.stories
  SET viewers_count = (
    SELECT count(DISTINCT viewer_id)::integer
    FROM public.story_views
    WHERE story_id = target_story_id
  )
  WHERE id = target_story_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
