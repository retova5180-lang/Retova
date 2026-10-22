-- ARS Home post metadata and story privacy/reactions.
-- Applied to Supabase project bfqsqgfyyewnfxekirfv as ars_home_post_story_features.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS mentions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hashtags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true;

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS privacy text NOT NULL DEFAULT 'public'
    CHECK (privacy IN ('public', 'followers', 'private'));

DROP POLICY IF EXISTS "Public can view active stories" ON public.stories;
CREATE POLICY "Public can view active public stories"
  ON public.stories FOR SELECT TO anon, authenticated
  USING (expires_at > now() AND privacy = 'public');

CREATE POLICY "Followers can view active followers stories"
  ON public.stories FOR SELECT TO authenticated
  USING (
    expires_at > now()
    AND privacy = 'followers'
    AND EXISTS (
      SELECT 1 FROM public.followers f
      WHERE f.follower_id = auth.uid()
        AND f.following_id = stories.user_id
    )
  );

CREATE POLICY "Users can view own private stories"
  ON public.stories FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.story_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('💜', '🔥', '😂', '😍', '👏', '😮')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can react to active stories"
  ON public.story_reactions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.expires_at > now()
    )
  );

CREATE POLICY "Users can update own story reactions"
  ON public.story_reactions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own story reactions"
  ON public.story_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Story owners and reactors can view reactions"
  ON public.story_reactions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.story_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(draft_data) = 'object'),
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.story_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own story draft"
  ON public.story_drafts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Story owners can view story views"
  ON public.story_views FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.user_id = auth.uid()
    )
  );
