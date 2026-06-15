WITH gp_sessions AS (
    SELECT
        schedule."RoundNumber",
        x.session,
        x.session_date,
        schedule.year
    FROM bronze.schedule AS schedule
    CROSS JOIN LATERAL (
        VALUES
            (schedule."Session1", schedule."Session1Date"),
            (schedule."Session2", schedule."Session2Date"),
            (schedule."Session3", schedule."Session3Date"),
            (schedule."Session4", schedule."Session4Date"),
            (schedule."Session5", schedule."Session5Date")
    ) x(session, session_date)
    WHERE
        schedule."RoundNumber" > 0 AND
        schedule.year = {year}
),

gp_sessions_formated AS (
    SELECT
        "RoundNumber" AS gp,
        CASE
            WHEN session = 'Practice 1' THEN 'FP1'
            WHEN session = 'Practice 2' THEN 'FP2'
            WHEN session = 'Practice 3' THEN 'FP3'
            WHEN session = 'Sprint Qualifying' THEN 'SQ'
            WHEN session = 'Sprint' THEN 'S'
            WHEN session = 'Qualifying' THEN 'Q'
            WHEN session = 'Race' THEN 'R'
        END AS session,
        session_date,
        year
    FROM
        gp_sessions
)

SELECT 
    sessions.gp,
    sessions.session
FROM 
    gp_sessions_formated AS sessions
WHERE 
    sessions.session_date < CURRENT_TIMESTAMP
    AND 
    (
        NOT EXISTS (
            SELECT 1
            FROM bronze.results r
            WHERE r.gp = sessions.gp
            AND r.session = sessions.session
            AND r.year = sessions.year
        )
        OR
        NOT EXISTS (
            SELECT 1
            FROM bronze.laps l
            WHERE l.gp = sessions.gp
            AND l.session = sessions.session
            AND l.year = sessions.year
        )
    )
