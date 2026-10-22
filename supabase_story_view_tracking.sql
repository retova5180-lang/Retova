-- Keep story view counts in sync and prevent duplicate viewer records.

CREATE UNIQUE INDEX IF NOT EXISTS story_views_story_viewer_unique
  ON public.story_views (story_id, viewer_id);

CREATE OR REPLACE FUNCTION public.refresh_story_viewer_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_story_id uuid;
BEGIN
  target_story_id := COALESCE(NEW.story_id, OLD.story_id);
  UPDATE public.stories
  SET viewers_count = (
    SELECT count(DISTINCT viewer_id)::integer
    FROM public.story_views
    WHERE story_id = target_story_id
  )
  WHERE id = target_story_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS story_views_refresh_count ON public.story_views;
CREATE TRIGGER story_views_refresh_count
AFTER INSERT OR UPDATE OR DELETE ON public.story_views
FOR EACH ROW EXECUTE FUNCTION public.refresh_story_viewer_count();
