CREATE OR REPLACE FUNCTION private.notify_comment_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recipient_id uuid;
  notification_type text;
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT c.user_id
      INTO recipient_id
      FROM public.comments AS c
     WHERE c.id = NEW.parent_comment_id
       AND c.post_id = NEW.post_id;
    notification_type := 'reply';
  ELSE
    SELECT p.user_id
      INTO recipient_id
      FROM public.posts AS p
     WHERE p.id = NEW.post_id;
    notification_type := 'comment';
  END IF;

  IF recipient_id IS NULL OR recipient_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications
    (user_id, sender_id, type, post_id, is_read, metadata)
  VALUES
    (
      recipient_id,
      NEW.user_id,
      notification_type,
      NEW.post_id,
      false,
      jsonb_build_object(
        'comment_id', NEW.id,
        'parent_comment_id', NEW.parent_comment_id,
        'message', CASE
          WHEN notification_type = 'reply' THEN 'replied to your comment.'
          ELSE 'commented on your post.'
        END
      )
    );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_comment_recipient() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS comments_notify_recipient ON public.comments;
CREATE TRIGGER comments_notify_recipient
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION private.notify_comment_recipient();
