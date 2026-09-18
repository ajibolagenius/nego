-- Two talents cannot share a profile URL.
--
-- /t/[slug] resolves a talent by talentSlug(): the slugified username, falling
-- back to the slugified display_name. This index is on that same derived key
-- rather than on username itself, so it rejects exactly the pairs that would
-- make each other unreachable — '@bigkallang' and 'bigkallang' are one name
-- here, and the second one to be claimed is refused.
--
-- Partial by design: only talents have a public profile URL, and the 2500+
-- client rows carry username IS NULL.
--
-- A row whose username and display_name both slugify to empty indexes as NULL
-- and is skipped; talentSlug() gives those the /talent/{uuid} form, which is
-- unique already.
--
-- Not CONCURRENTLY: Supabase runs migrations in a transaction, and the table is
-- small enough (~3k rows) that the lock is momentary.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_talent_slug_unique
    ON public.profiles (
        coalesce(
            nullif(btrim(regexp_replace(lower(username), '[^a-z0-9]+', '-', 'g'), '-'), ''),
            nullif(btrim(regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g'), '-'), '')
        )
    )
    WHERE role = 'talent';
