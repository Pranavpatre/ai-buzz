ALTER TABLE public.digests DROP CONSTRAINT digests_type_check;
ALTER TABLE public.digests ADD CONSTRAINT digests_type_check CHECK (type IN ('podcast', 'newsletter', 'news', 'youtube', 'x'));