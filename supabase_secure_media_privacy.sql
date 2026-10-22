-- Secure story media according to story visibility.
UPDATE storage.buckets SET public = false WHERE id = 'story-media';

DROP POLICY IF EXISTS "Story owners can read own story media" ON storage.objects;
CREATE POLICY "Authorized users can read active story media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'story-media'
    AND EXISTS (
      SELECT 1
      FROM public.stories s
      WHERE s.image = objects.name
        AND s.expires_at > now()
        AND (
          s.privacy = 'public'
          OR s.user_id = auth.uid()
          OR (
            s.privacy = 'followers'
            AND EXISTS (
              SELECT 1 FROM public.followers f
              WHERE f.follower_id = auth.uid()
                AND f.following_id = s.user_id
            )
          )
        )
    )
  );
