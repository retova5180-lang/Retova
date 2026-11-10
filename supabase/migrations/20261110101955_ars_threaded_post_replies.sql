ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid
  REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS comments_post_parent_created_idx
  ON public.comments (post_id, parent_comment_id, created_at);

DROP POLICY IF EXISTS "Users can create own comments" ON public.comments;

CREATE POLICY "Users can create own comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      parent_comment_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.comments AS parent
        WHERE parent.id = comments.parent_comment_id
          AND parent.post_id = comments.post_id
      )
    )
  );
