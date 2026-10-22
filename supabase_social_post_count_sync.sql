-- Maintain engagement counters from their source rows.

CREATE OR REPLACE FUNCTION public.sync_post_engagement_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  UPDATE public.posts p
  SET
    likes_count = (SELECT count(*)::integer FROM public.likes l WHERE l.post_id = target_post_id),
    comments_count = (SELECT count(*)::integer FROM public.comments c WHERE c.post_id = target_post_id),
    reposts_count = (SELECT count(*)::integer FROM public.reposts r WHERE r.post_id = target_post_id)
  WHERE p.id = target_post_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS likes_sync_post_counts ON public.likes;
CREATE TRIGGER likes_sync_post_counts
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_engagement_counts();

DROP TRIGGER IF EXISTS comments_sync_post_counts ON public.comments;
CREATE TRIGGER comments_sync_post_counts
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_engagement_counts();

DROP TRIGGER IF EXISTS reposts_sync_post_counts ON public.reposts;
CREATE TRIGGER reposts_sync_post_counts
AFTER INSERT OR DELETE ON public.reposts
FOR EACH ROW EXECUTE FUNCTION public.sync_post_engagement_counts();

UPDATE public.posts p
SET
  likes_count = (SELECT count(*)::integer FROM public.likes l WHERE l.post_id = p.id),
  comments_count = (SELECT count(*)::integer FROM public.comments c WHERE c.post_id = p.id),
  reposts_count = (SELECT count(*)::integer FROM public.reposts r WHERE r.post_id = p.id);
