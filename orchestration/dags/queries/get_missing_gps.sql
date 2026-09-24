WITH gp_sessions AS (
    SELECT
        schedule."RoundNumber" AS gp,
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
    WHERE schedule."RoundNumber" > 0
),

gp_sessions_formated AS (
    SELECT
        gp,
        CASE session
            WHEN 'Practice 1' THEN 'FP1'
            WHEN 'Practice 2' THEN 'FP2'
            WHEN 'Practice 3' THEN 'FP3'
            WHEN 'Sprint Qualifying' THEN 'SQ'
            WHEN 'Sprint Shootout' THEN 'SS'
            WHEN 'Sprint' THEN 'S'
            WHEN 'Qualifying' THEN 'Q'
            WHEN 'Race' THEN 'R'
            ELSE UPPER(regexp_replace(session, '(\w)\w*\s*', '\1', 'g'))
        END AS session,
        session_date,
        year
    FROM gp_sessions
    WHERE session_date <= CURRENT_TIMESTAMP - INTERVAL '3 hour'
)

SELECT 
    sessions.year,
    sessions.gp,
    sessions.session
FROM 
  gp_sessions_formated AS sessions
LEFT JOIN 
  (
    SELECT DISTINCT year, gp, session 
    FROM bronze.results
  ) results
  ON results.year = sessions.year AND results.gp = sessions.gp AND results.session = sessions.session
LEFT JOIN 
  (
    SELECT DISTINCT year, gp, session 
    FROM bronze.laps
  ) laps
  ON laps.year = sessions.year AND laps.gp = sessions.gp AND laps.session = sessions.session
WHERE 
  results.year IS NULL 
  OR (
    laps.year IS NULL 
    AND NOT EXISTS (
      SELECT 1 
      FROM bronze.results r 
      WHERE r.year = sessions.year 
        AND r.gp = sessions.gp 
        AND r.session = sessions.session
        AND (r."Laps" IS NULL OR r."Laps" = 0)
    )
  );