CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx
  ON public.comments (parent_comment_id);
