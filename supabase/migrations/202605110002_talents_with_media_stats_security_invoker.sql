create or replace view public.talents_with_media_stats as
select
    p.*,
    coalesce(count(m.id), 0) as total_media,
    coalesce(count(m.id) filter (where m.is_premium), 0) as premium_media,
    coalesce(count(m.id) filter (where not m.is_premium), 0) as free_media
from public.profiles p
left join public.media m
    on m.talent_id = p.id
where p.role = 'talent'
group by p.id;

alter view public.talents_with_media_stats set (security_invoker = true);
