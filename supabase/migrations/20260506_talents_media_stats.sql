-- Clean up the old view if it exists
DROP VIEW IF EXISTS female_talents_with_media_stats;

-- View for all talents with aggregated media counts
-- Uses INNER JOIN to only include talents that have at least 1 media item
CREATE OR REPLACE VIEW talents_with_media_stats AS
SELECT 
    p.*,
    COUNT(m.id) as total_media,
    COALESCE(SUM(CASE WHEN m.is_premium = true THEN 1 ELSE 0 END), 0) as premium_media,
    COALESCE(SUM(CASE WHEN m.is_premium = false THEN 1 ELSE 0 END), 0) as free_media
FROM 
    profiles p
INNER JOIN 
    media m ON p.id = m.talent_id
WHERE 
    p.role = 'talent'
GROUP BY 
    p.id;
