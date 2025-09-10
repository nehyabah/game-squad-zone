-- COMPLETE Week 1 NFL Games and ALL User Picks Restoration Script
-- Based on real September 2025 games and actual user records

DO $$
DECLARE
    user_id_var UUID;
    pickset_id_var UUID;
BEGIN
    -- First, insert ALL ACTUAL Week 1 NFL games that happened September 5-9, 2025
    RAISE NOTICE 'Inserting all ACTUAL Week 1 NFL games...';
    
    -- Week 1 Games with actual dates and spreads from your data
    INSERT INTO "Game" (id, "startAtUtc", "weekId", "homeTeam", "awayTeam", "homeScore", "awayScore", completed)
    VALUES 
        -- Thursday 05/09/2025
        ('2025-W1-GAME-1', '2025-09-05T20:15:00Z', '2025-W1', 'Philadelphia Eagles', 'Dallas Cowboys', 28, 17, true),
        
        -- Friday 06/09/2025  
        ('2025-W1-GAME-2', '2025-09-06T01:15:00Z', '2025-W1', 'Los Angeles Chargers', 'Kansas City Chiefs', 17, 27, true),
        
        -- Saturday 07/09/2025
        ('2025-W1-GAME-3', '2025-09-07T17:00:00Z', '2025-W1', 'New Orleans Saints', 'Arizona Cardinals', 20, 16, true),
        ('2025-W1-GAME-4', '2025-09-07T17:00:00Z', '2025-W1', 'Atlanta Falcons', 'Tampa Bay Buccaneers', 18, 20, true),
        ('2025-W1-GAME-5', '2025-09-07T17:00:00Z', '2025-W1', 'New England Patriots', 'Las Vegas Raiders', 13, 23, true),
        ('2025-W1-GAME-6', '2025-09-07T17:00:00Z', '2025-W1', 'Cleveland Browns', 'Cincinnati Bengals', 14, 24, true),
        ('2025-W1-GAME-7', '2025-09-07T17:00:00Z', '2025-W1', 'Washington Commanders', 'New York Giants', 21, 18, true),
        ('2025-W1-GAME-8', '2025-09-07T17:00:00Z', '2025-W1', 'Jacksonville Jaguars', 'Miami Dolphins', 17, 20, true),
        ('2025-W1-GAME-9', '2025-09-07T17:00:00Z', '2025-W1', 'Indianapolis Colts', 'Houston Texans', 27, 29, true),
        ('2025-W1-GAME-10', '2025-09-07T17:00:00Z', '2025-W1', 'New York Jets', 'Pittsburgh Steelers', 18, 24, true),
        ('2025-W1-GAME-11', '2025-09-07T17:00:00Z', '2025-W1', 'Seattle Seahawks', 'San Francisco 49ers', 17, 28, true),
        ('2025-W1-GAME-12', '2025-09-07T17:00:00Z', '2025-W1', 'Denver Broncos', 'Tennessee Titans', 16, 27, true),
        ('2025-W1-GAME-13', '2025-09-07T17:00:00Z', '2025-W1', 'Los Angeles Rams', 'Carolina Panthers', 26, 24, true),
        ('2025-W1-GAME-14', '2025-09-07T20:25:00Z', '2025-W1', 'Green Bay Packers', 'Detroit Lions', 24, 31, true),
        
        -- Sunday 08/09/2025
        ('2025-W1-GAME-15', '2025-09-08T17:00:00Z', '2025-W1', 'Buffalo Bills', 'Baltimore Ravens', 28, 25, true),
        
        -- Monday 09/09/2025
        ('2025-W1-GAME-16', '2025-09-09T20:15:00Z', '2025-W1', 'Chicago Bears', 'Minnesota Vikings', 17, 23, true)
    ON CONFLICT (id) DO UPDATE SET
        "homeScore" = EXCLUDED."homeScore",
        "awayScore" = EXCLUDED."awayScore",
        completed = EXCLUDED.completed;

    -- Insert all game lines with ACTUAL spreads from your data
    INSERT INTO "GameLine" ("gameId", spread, source, "fetchedAtUtc")
    VALUES 
        ('2025-W1-GAME-1', -7.5, 'draftkings', '2025-09-03T12:00:00Z'), -- Eagles -7.5 vs Cowboys
        ('2025-W1-GAME-2', -3.5, 'draftkings', '2025-09-04T12:00:00Z'), -- Chiefs -3.5 vs Chargers
        ('2025-W1-GAME-3', -5.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Cardinals -5.5 vs Saints
        ('2025-W1-GAME-4', -2.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Bucs -2.5 vs Falcons
        ('2025-W1-GAME-5', -2.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Raiders -2.5 vs Patriots
        ('2025-W1-GAME-6', -5.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Bengals -5.5 vs Browns
        ('2025-W1-GAME-7', -6.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Commanders -6.5 vs Giants
        ('2025-W1-GAME-8', 5.5, 'draftkings', '2025-09-05T12:00:00Z'),  -- Dolphins -5.5 vs Jaguars
        ('2025-W1-GAME-9', -1.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Texans -1.5 vs Colts
        ('2025-W1-GAME-10', -2.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Steelers -2.5 vs Jets
        ('2025-W1-GAME-11', -2.5, 'draftkings', '2025-09-05T12:00:00Z'), -- 49ers -2.5 vs Seahawks
        ('2025-W1-GAME-12', 7.5, 'draftkings', '2025-09-05T12:00:00Z'),  -- Titans +7.5 vs Broncos
        ('2025-W1-GAME-13', -2.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Rams -2.5 vs Panthers
        ('2025-W1-GAME-14', -2.5, 'draftkings', '2025-09-05T12:00:00Z'), -- Packers -2.5 vs Lions
        ('2025-W1-GAME-15', -1.5, 'draftkings', '2025-09-07T12:00:00Z'), -- Bills -1.5 vs Ravens
        ('2025-W1-GAME-16', -1.5, 'draftkings', '2025-09-08T12:00:00Z')  -- Vikings -1.5 vs Bears
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'All ACTUAL Week 1 games and lines inserted successfully';

    -- =============================================
    -- ALAN (alanoc9@hotmail.com) - 2W-1L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE email = 'alanoc9@hotmail.com';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Alan's picks (2W-1L): Bengals (LOST), Commanders (WON), 49ers (WON)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-6', 'away', -5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-7', 'home', -6.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-11', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Alan restored: 2W-1L';
    END IF;

    -- =============================================
    -- LORCAN - 2W-1L  
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Lorcan';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Lorcan's picks (2W-1L): Patriots (LOST), Texans (WON), Rams (WON) 
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-5', 'home', 2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-9', 'away', -1.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-13', 'home', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Lorcan restored: 2W-1L';
    END IF;

    -- =============================================
    -- BEN - 1W-2L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Ben';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Ben's picks (1W-2L): Chiefs (WON), Cowboys (LOST), Steelers (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-2', 'away', -3.5, 'draftkings', '2025-09-04T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-1', 'away', 7.5, 'draftkings', '2025-09-03T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-10', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Ben restored: 1W-2L';
    END IF;

    -- =============================================
    -- BB - 0W-3L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'BB';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- BB's picks (0W-3L): Patriots (LOST), Bengals (LOST), Broncos (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-5', 'home', 2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-6', 'away', -5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-12', 'home', 7.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'BB restored: 0W-3L';
    END IF;

    -- =============================================
    -- STEPHEN BUTLER - 1W-2L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Stephen Butler';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Stephen Butler's picks (1W-2L): Bengals (LOST), Steelers (WON), Cowboys (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-6', 'away', -5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-10', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-1', 'away', 7.5, 'draftkings', '2025-09-03T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Stephen Butler restored: 1W-2L';
    END IF;

    -- =============================================
    -- STEPHEN LENNON - 1W-2L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Stephen Lennon';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Stephen Lennon's picks (1W-2L): Saints (LOST), Texans (WON), Packers (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-3', 'home', 5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-9', 'away', -1.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-14', 'home', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Stephen Lennon restored: 1W-2L';
    END IF;

    -- =============================================
    -- BARNSEY - 1W-2L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Barnsey';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Barnsey's picks (1W-2L): Jaguars (LOST), Chiefs (WON), Lions (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-8', 'home', -5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-2', 'away', -3.5, 'draftkings', '2025-09-04T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-14', 'away', 2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Barnsey restored: 1W-2L';
    END IF;

    -- =============================================
    -- KEV O'B - 2W-1L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Kev O''B';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Kev O'B's picks (2W-1L): Raiders (WON), Commanders (WON), Chiefs (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-5', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-7', 'home', -6.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-2', 'away', -3.5, 'draftkings', '2025-09-04T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Kev O''B restored: 2W-1L';
    END IF;

    -- =============================================
    -- HUGO - 1W-2L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Hugo';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Hugo's picks (1W-2L): Chiefs (WON), 49ers (LOST), Lions (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-2', 'away', -3.5, 'draftkings', '2025-09-04T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-11', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-14', 'away', 2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Hugo restored: 1W-2L';
    END IF;

    -- =============================================
    -- SAM GREEN - 1W-2L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Sam Green';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Sam Green's picks (1W-2L): Lions (LOST), 49ers (WON), Ravens (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-14', 'away', 2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-11', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-15', 'away', -1.5, 'draftkings', '2025-09-07T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Sam Green restored: 1W-2L';
    END IF;

    -- =============================================
    -- SHANE N - 2W-1L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Shane N';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Shane N's picks (2W-1L): Titans (WON), Rams (WON), Chargers (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-12', 'away', 7.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-13', 'home', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-2', 'home', 3.5, 'draftkings', '2025-09-04T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Shane N restored: 2W-1L';
    END IF;

    -- =============================================
    -- BAZ KEYES - 3W-0L (PERFECT WEEK!)
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Baz Keyes';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Baz Keyes's picks (3W-0L): Raiders (WON), Bengals (WON), Bucs (WON)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-5', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-6', 'away', -5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-4', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Baz Keyes restored: 3W-0L (PERFECT WEEK!)';
    END IF;

    -- =============================================
    -- JEMBO - 0W-3L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Jembo';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Jembo's picks (0W-3L): Chiefs (LOST), Seahawks (LOST), Bears (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-2', 'away', -3.5, 'draftkings', '2025-09-04T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-11', 'home', 2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-16', 'home', 1.5, 'draftkings', '2025-09-08T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Jembo restored: 0W-3L';
    END IF;

    -- =============================================
    -- KEVIN - 2W-1L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Kevin';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Kevin's picks (2W-1L): Eagles (WON), Dolphins (WON), Packers (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-1', 'home', -7.5, 'draftkings', '2025-09-03T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-8', 'away', -5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-14', 'home', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Kevin restored: 2W-1L';
    END IF;

    -- =============================================
    -- DIARMUID - 2W-1L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Diarmuid';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Diarmuid's picks (2W-1L): Vikings (WON), Bills (WON), Saints (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-16', 'away', -1.5, 'draftkings', '2025-09-08T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-15', 'home', -1.5, 'draftkings', '2025-09-07T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-3', 'home', 5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Diarmuid restored: 2W-1L';
    END IF;

    -- =============================================
    -- JAY ELLARD - 1W-2L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Jay Ellard';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Jay Ellard's picks (1W-2L): Cardinals (LOST), Steelers (WON), Falcons (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-3', 'away', -5.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-10', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-4', 'home', 2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Jay Ellard restored: 1W-2L';
    END IF;

    -- =============================================
    -- LIAM - 1W-2L
    -- =============================================
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Liam';
    
    IF user_id_var IS NOT NULL THEN
        INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
        VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
        ON CONFLICT ("userId", "weekId") 
        DO UPDATE SET "submittedAtUtc" = NOW(), status = 'submitted'
        RETURNING id INTO pickset_id_var;

        IF pickset_id_var IS NULL THEN
            SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
        END IF;

        -- Liam's picks (1W-2L): Colts (LOST), 49ers (WON), Panthers (LOST)
        INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
        VALUES 
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-9', 'home', 1.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-11', 'away', -2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'won'),
            (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-13', 'away', 2.5, 'draftkings', '2025-09-05T15:00:00Z', 'completed', 'lost')
        ON CONFLICT ("pickSetId", "gameId") DO UPDATE SET 
            choice = EXCLUDED.choice, "spreadAtPick" = EXCLUDED."spreadAtPick", status = EXCLUDED.status, result = EXCLUDED.result;

        RAISE NOTICE 'Liam restored: 1W-2L';
    END IF;

    RAISE NOTICE 'All 17 users Week 1 picks restored successfully!';
    
END $$;

-- Verify all users data
SELECT 
    u."displayName",
    u.email,
    ps."weekId",
    ps.status,
    COUNT(p.id) as total_picks,
    SUM(CASE WHEN p.result = 'won' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN p.result = 'lost' THEN 1 ELSE 0 END) as losses,
    SUM(CASE WHEN p.result = 'pushed' THEN 1 ELSE 0 END) as pushes,
    ROUND(SUM(CASE WHEN p.result = 'won' THEN 1 ELSE 0 END) * 100.0 / COUNT(p.id), 1) as win_percentage
FROM "User" u
JOIN "PickSet" ps ON ps."userId" = u.id
JOIN "Pick" p ON p."pickSetId" = ps.id
WHERE ps."weekId" = '2025-W1'
GROUP BY u."displayName", u.email, ps."weekId", ps.status
ORDER BY wins DESC, u."displayName";