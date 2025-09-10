-- Week 1 Picks Data Insertion Script
-- User: Lorcan (using displayName)
-- Picks: Bengals (lost), Commanders (won), 49ers (won)
-- Record: 2 wins, 1 loss, 0 pushes

DO $$
DECLARE
    user_id_var UUID;
    pickset_id_var UUID;
BEGIN
    -- Get the user ID by displayName
    SELECT id INTO user_id_var FROM "User" WHERE "displayName" = 'Lorcan';
    
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'User with displayName Lorcan not found';
    END IF;

    -- Insert or update the PickSet for Week 1
    INSERT INTO "PickSet" (id, "userId", "weekId", "submittedAtUtc", status)
    VALUES (gen_random_uuid(), user_id_var, '2025-W1', NOW(), 'submitted')
    ON CONFLICT ("userId", "weekId") 
    DO UPDATE SET 
        "submittedAtUtc" = NOW(),
        status = 'submitted'
    RETURNING id INTO pickset_id_var;

    -- If it was an update, get the existing pickset ID
    IF pickset_id_var IS NULL THEN
        SELECT id INTO pickset_id_var FROM "PickSet" WHERE "userId" = user_id_var AND "weekId" = '2025-W1';
    END IF;

    -- Insert Week 1 Games (ensure all games exist)
    -- Game 2: Bengals vs Steelers (Lorcan picked Bengals - LOST)
    INSERT INTO "Game" (id, "startAtUtc", "weekId", "homeTeam", "awayTeam", "homeScore", "awayScore", completed)
    VALUES ('2025-W1-GAME-2', '2025-01-12T20:00:00Z', '2025-W1', 'Cincinnati Bengals', 'Pittsburgh Steelers', 17, 24, true)
    ON CONFLICT (id) DO UPDATE SET
        "homeScore" = 17,
        "awayScore" = 24,
        completed = true;

    -- Game 4: Commanders vs Eagles (Lorcan picked Commanders - WON)
    INSERT INTO "Game" (id, "startAtUtc", "weekId", "homeTeam", "awayTeam", "homeScore", "awayScore", completed)
    VALUES ('2025-W1-GAME-4', '2025-01-12T16:30:00Z', '2025-W1', 'Washington Commanders', 'Philadelphia Eagles', 28, 21, true)
    ON CONFLICT (id) DO UPDATE SET
        "homeScore" = 28,
        "awayScore" = 21,
        completed = true;

    -- Game 11: 49ers vs Seahawks (Lorcan picked 49ers - WON)
    INSERT INTO "Game" (id, "startAtUtc", "weekId", "homeTeam", "awayTeam", "homeScore", "awayScore", completed)
    VALUES ('2025-W1-GAME-11', '2025-01-12T16:05:00Z', '2025-W1', 'San Francisco 49ers', 'Seattle Seahawks', 31, 17, true)
    ON CONFLICT (id) DO UPDATE SET
        "homeScore" = 31,
        "awayScore" = 17,
        completed = true;

    -- Insert Game Lines (sample spreads at time of picks)
    INSERT INTO "GameLine" ("gameId", spread, source, "fetchedAtUtc")
    VALUES 
        ('2025-W1-GAME-2', -3.0, 'draftkings', '2025-01-10T12:00:00Z'),
        ('2025-W1-GAME-4', -2.5, 'draftkings', '2025-01-10T12:00:00Z'),
        ('2025-W1-GAME-11', -5.5, 'draftkings', '2025-01-10T12:00:00Z')
    ON CONFLICT DO NOTHING;

    -- Insert Lorcan's picks
    -- Pick 1: Bengals (home) vs Steelers - LOST
    INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
    VALUES (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-2', 'home', -3.0, 'draftkings', '2025-01-10T12:00:00Z', 'completed', 'lost')
    ON CONFLICT ("pickSetId", "gameId") 
    DO UPDATE SET 
        choice = 'home',
        "spreadAtPick" = -3.0,
        status = 'completed',
        result = 'lost';

    -- Pick 2: Commanders (home) vs Eagles - WON
    INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
    VALUES (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-4', 'home', -2.5, 'draftkings', '2025-01-10T12:00:00Z', 'completed', 'won')
    ON CONFLICT ("pickSetId", "gameId")
    DO UPDATE SET 
        choice = 'home',
        "spreadAtPick" = -2.5,
        status = 'completed',
        result = 'won';

    -- Pick 3: 49ers (home) vs Seahawks - WON
    INSERT INTO "Pick" (id, "pickSetId", "gameId", choice, "spreadAtPick", "lineSource", "createdAtUtc", status, result)
    VALUES (gen_random_uuid(), pickset_id_var, '2025-W1-GAME-11', 'home', -5.5, 'draftkings', '2025-01-10T12:00:00Z', 'completed', 'won')
    ON CONFLICT ("pickSetId", "gameId")
    DO UPDATE SET 
        choice = 'home',
        "spreadAtPick" = -5.5,
        status = 'completed',
        result = 'won';

    RAISE NOTICE 'Week 1 picks inserted successfully for Lorcan: %', user_id_var;
    RAISE NOTICE 'PickSet ID: %', pickset_id_var;
END $$;

-- Verify the data was inserted correctly
SELECT 
    u."displayName",
    u.email,
    ps."weekId",
    ps.status,
    COUNT(p.id) as total_picks,
    SUM(CASE WHEN p.result = 'won' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN p.result = 'lost' THEN 1 ELSE 0 END) as losses,
    SUM(CASE WHEN p.result = 'pushed' THEN 1 ELSE 0 END) as pushes
FROM "User" u
JOIN "PickSet" ps ON ps."userId" = u.id
JOIN "Pick" p ON p."pickSetId" = ps.id
WHERE u."displayName" = 'Lorcan' AND ps."weekId" = '2025-W1'
GROUP BY u."displayName", u.email, ps."weekId", ps.status;

-- Show the individual picks with game details
SELECT 
    u."displayName",
    g."homeTeam",
    g."awayTeam", 
    g."homeScore",
    g."awayScore",
    p.choice,
    p."spreadAtPick",
    p.result,
    CASE 
        WHEN p.choice = 'home' THEN g."homeTeam"
        ELSE g."awayTeam"
    END as picked_team
FROM "User" u
JOIN "PickSet" ps ON ps."userId" = u.id
JOIN "Pick" p ON p."pickSetId" = ps.id
JOIN "Game" g ON g.id = p."gameId"
WHERE u."displayName" = 'Lorcan' AND ps."weekId" = '2025-W1'
ORDER BY g."startAtUtc";