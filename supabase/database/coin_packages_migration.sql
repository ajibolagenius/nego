-- Coin Packages Migration
-- Based on SERVICE_RECOMMENDATIONS.md
-- Coin Rate: 1 Coin = ₦10 Naira
-- Minimum Service: ₦100,000 = 10,000 coins

-- Add new columns for tags if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coin_packages' AND column_name = 'is_new') THEN
        ALTER TABLE coin_packages ADD COLUMN is_new BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coin_packages' AND column_name = 'is_recommended') THEN
        ALTER TABLE coin_packages ADD COLUMN is_recommended BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update or insert coin packages based on recommendations
-- Uses DO blocks to UPDATE existing packages or INSERT if they don't exist

-- Starter Package (1,000 coins)
DO $$
BEGIN
    UPDATE coin_packages 
    SET 
        price = 10000,
        price_in_kobo = 1000000,
        display_name = '1,000 Coins',
        description = 'Starter package - Good for testing the platform',
        popular = false,
        best_value = false,
        is_new = false,
        is_recommended = false,
        is_active = true,
        display_order = 1,
        updated_at = NOW()
    WHERE coins = 1000;
    
    IF NOT FOUND THEN
        INSERT INTO coin_packages (coins, price, price_in_kobo, display_name, description, popular, best_value, is_new, is_recommended, is_active, display_order)
        VALUES (1000, 10000, 1000000, '1,000 Coins', 'Starter package - Good for testing the platform', false, false, false, false, true, 1);
    END IF;
END $$;

-- Standard Package (5,000 coins) - Most Popular
DO $$
BEGIN
    UPDATE coin_packages 
    SET 
        price = 50000,
        price_in_kobo = 5000000,
        display_name = '5,000 Coins',
        description = 'Standard package - Partial payment towards minimum service',
        popular = true,
        best_value = false,
        is_new = false,
        is_recommended = false,
        is_active = true,
        display_order = 2,
        updated_at = NOW()
    WHERE coins = 5000;
    
    IF NOT FOUND THEN
        INSERT INTO coin_packages (coins, price, price_in_kobo, display_name, description, popular, best_value, is_new, is_recommended, is_active, display_order)
        VALUES (5000, 50000, 5000000, '5,000 Coins', 'Standard package - Partial payment towards minimum service', true, false, false, false, true, 2);
    END IF;
END $$;

-- Premium Package (10,000 coins) - Best Value
DO $$
BEGIN
    UPDATE coin_packages 
    SET 
        price = 100000,
        price_in_kobo = 10000000,
        display_name = '10,000 Coins',
        description = 'Premium package - One minimum service',
        popular = false,
        best_value = true,
        is_new = false,
        is_recommended = false,
        is_active = true,
        display_order = 3,
        updated_at = NOW()
    WHERE coins = 10000;
    
    IF NOT FOUND THEN
        INSERT INTO coin_packages (coins, price, price_in_kobo, display_name, description, popular, best_value, is_new, is_recommended, is_active, display_order)
        VALUES (10000, 100000, 10000000, '10,000 Coins', 'Premium package - One minimum service', false, true, false, false, true, 3);
    END IF;
END $$;

-- Premium Plus Package (15,000 coins) - Recommended (NEW PACKAGE)
DO $$
BEGIN
    UPDATE coin_packages 
    SET 
        price = 150000,
        price_in_kobo = 15000000,
        display_name = '15,000 Coins',
        description = 'Premium Plus package - One and a half services',
        popular = false,
        best_value = false,
        is_new = true,
        is_recommended = true,
        is_active = true,
        display_order = 4,
        updated_at = NOW()
    WHERE coins = 15000;
    
    IF NOT FOUND THEN
        INSERT INTO coin_packages (coins, price, price_in_kobo, display_name, description, popular, best_value, is_new, is_recommended, is_active, display_order)
        VALUES (15000, 150000, 15000000, '15,000 Coins', 'Premium Plus package - One and a half services', false, false, true, true, true, 4);
    END IF;
END $$;

-- Deluxe Package (25,000 coins)
DO $$
BEGIN
    UPDATE coin_packages 
    SET 
        price = 250000,
        price_in_kobo = 25000000,
        display_name = '25,000 Coins',
        description = 'Deluxe package - Multiple services or premium packages',
        popular = false,
        best_value = false,
        is_new = false,
        is_recommended = false,
        is_active = true,
        display_order = 5,
        updated_at = NOW()
    WHERE coins = 25000;
    
    IF NOT FOUND THEN
        INSERT INTO coin_packages (coins, price, price_in_kobo, display_name, description, popular, best_value, is_new, is_recommended, is_active, display_order)
        VALUES (25000, 250000, 25000000, '25,000 Coins', 'Deluxe package - Multiple services or premium packages', false, false, false, false, true, 5);
    END IF;
END $$;

-- Ultimate Package (50,000 coins)
DO $$
BEGIN
    UPDATE coin_packages 
    SET 
        price = 500000,
        price_in_kobo = 50000000,
        display_name = '50,000 Coins',
        description = 'Ultimate package - High-value services and multiple bookings',
        popular = false,
        best_value = false,
        is_new = false,
        is_recommended = false,
        is_active = true,
        display_order = 6,
        updated_at = NOW()
    WHERE coins = 50000;
    
    IF NOT FOUND THEN
        INSERT INTO coin_packages (coins, price, price_in_kobo, display_name, description, popular, best_value, is_new, is_recommended, is_active, display_order)
        VALUES (50000, 500000, 50000000, '50,000 Coins', 'Ultimate package - High-value services and multiple bookings', false, false, false, false, true, 6);
    END IF;
END $$;
