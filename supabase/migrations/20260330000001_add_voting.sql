-- Votes table
CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  digest_id UUID NOT NULL REFERENCES public.digests(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, digest_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own votes" ON public.votes FOR ALL USING (auth.uid() = user_id);

-- Denormalized vote score on digests for fast sorting
ALTER TABLE public.digests ADD COLUMN vote_score INTEGER NOT NULL DEFAULT 0;

-- Feed-level preference scores (learning from votes)
CREATE TABLE public.feed_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feed_id UUID NOT NULL REFERENCES public.feeds(id) ON DELETE CASCADE,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, feed_id)
);

ALTER TABLE public.feed_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own feed_scores" ON public.feed_scores FOR ALL USING (auth.uid() = user_id);

-- Atomic vote RPC: insert/flip/toggle vote + update digests.vote_score + upsert feed_scores
CREATE OR REPLACE FUNCTION public.cast_vote(p_user_id UUID, p_digest_id UUID, p_vote SMALLINT)
RETURNS void AS $$
DECLARE
  v_old_vote SMALLINT;
  v_feed_id UUID;
BEGIN
  -- Security: ensure caller is the user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT feed_id INTO v_feed_id FROM public.digests WHERE id = p_digest_id;
  SELECT vote INTO v_old_vote FROM public.votes WHERE user_id = p_user_id AND digest_id = p_digest_id;

  IF v_old_vote IS NOT NULL THEN
    IF v_old_vote = p_vote THEN
      -- Toggle off: remove vote
      DELETE FROM public.votes WHERE user_id = p_user_id AND digest_id = p_digest_id;
      UPDATE public.digests SET vote_score = vote_score - p_vote WHERE id = p_digest_id;
      IF v_feed_id IS NOT NULL THEN
        IF p_vote = 1 THEN
          UPDATE public.feed_scores SET upvotes = GREATEST(upvotes - 1, 0), updated_at = now() WHERE user_id = p_user_id AND feed_id = v_feed_id;
        ELSE
          UPDATE public.feed_scores SET downvotes = GREATEST(downvotes - 1, 0), updated_at = now() WHERE user_id = p_user_id AND feed_id = v_feed_id;
        END IF;
      END IF;
    ELSE
      -- Flip vote
      UPDATE public.votes SET vote = p_vote, created_at = now() WHERE user_id = p_user_id AND digest_id = p_digest_id;
      UPDATE public.digests SET vote_score = vote_score + (2 * p_vote) WHERE id = p_digest_id;
      IF v_feed_id IS NOT NULL THEN
        IF p_vote = 1 THEN
          UPDATE public.feed_scores SET upvotes = upvotes + 1, downvotes = GREATEST(downvotes - 1, 0), updated_at = now() WHERE user_id = p_user_id AND feed_id = v_feed_id;
        ELSE
          UPDATE public.feed_scores SET upvotes = GREATEST(upvotes - 1, 0), downvotes = downvotes + 1, updated_at = now() WHERE user_id = p_user_id AND feed_id = v_feed_id;
        END IF;
      END IF;
    END IF;
  ELSE
    -- New vote
    INSERT INTO public.votes (user_id, digest_id, vote) VALUES (p_user_id, p_digest_id, p_vote);
    UPDATE public.digests SET vote_score = vote_score + p_vote WHERE id = p_digest_id;
    IF v_feed_id IS NOT NULL THEN
      INSERT INTO public.feed_scores (user_id, feed_id, upvotes, downvotes)
      VALUES (
        p_user_id, v_feed_id,
        CASE WHEN p_vote = 1 THEN 1 ELSE 0 END,
        CASE WHEN p_vote = -1 THEN 1 ELSE 0 END
      )
      ON CONFLICT (user_id, feed_id) DO UPDATE SET
        upvotes = feed_scores.upvotes + CASE WHEN p_vote = 1 THEN 1 ELSE 0 END,
        downvotes = feed_scores.downvotes + CASE WHEN p_vote = -1 THEN 1 ELSE 0 END,
        updated_at = now();
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Email preferences
CREATE TABLE public.email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  weekly_digest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own email prefs" ON public.email_preferences FOR ALL USING (auth.uid() = user_id);
