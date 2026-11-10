-- Fix recursive RLS evaluation when inserting nested comments/replies.
-- The previous INSERT policy queried public.comments directly to validate
-- parent_comment_id. That SELECT invoked the comments SELECT policy and
-- recursively re-entered comments RLS.

CREATE OR REPLACE FUNCTION private.can_reply_to_comment(
  p_parent_comment_id uuid,
  p_post_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.comments AS parent
      JOIN public.posts AS post ON post.id = parent.post_id
      JOIN public.public_profiles AS profile ON profile.id = post.user_id
      WHERE parent.id = p_parent_comment_id
        AND parent.post_id = p_post_id
        AND COALESCE(post.allow_comments, true) = true
        AND (
          post.user_id = (SELECT auth.uid())
          OR (
            post.privacy = 'public'
            AND (
              NOT COALESCE(profile.is_private, false)
              OR EXISTS (
                SELECT 1 FROM public.followers AS f
                WHERE f.follower_id = (SELECT auth.uid())
                  AND f.following_id = post.user_id
                  AND f.status = 'accepted'
              )
            )
          )
          OR (
            post.privacy = 'followers'
            AND EXISTS (
              SELECT 1 FROM public.followers AS f
              WHERE f.follower_id = (SELECT auth.uid())
                AND f.following_id = post.user_id
                AND f.status = 'accepted'
            )
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.blocks AS b
          WHERE (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = post.user_id)
             OR (b.blocker_id = post.user_id AND b.blocked_id = (SELECT auth.uid()))
        )
    );
$function$;

REVOKE ALL ON FUNCTION private.can_reply_to_comment(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_reply_to_comment(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can create own comments" ON public.comments;
CREATE POLICY "Users can create own comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND (
    parent_comment_id IS NULL
    OR private.can_reply_to_comment(parent_comment_id, post_id)
  )
);
