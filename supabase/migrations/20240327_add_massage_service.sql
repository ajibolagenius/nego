-- Migration to add 'Massage' service type
-- Created on 2024-03-27

INSERT INTO service_types (name, icon, description)
SELECT 'Massage', 'pamper', 'Professional massage and relaxation services'
WHERE NOT EXISTS (
    SELECT 1 FROM service_types WHERE name = 'Massage'
);
