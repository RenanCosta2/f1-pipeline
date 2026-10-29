WITH gp_sessions AS (
    SELECT
        schedule.RoundNumber AS gp,
        x.session,
        x.session_date,
        schedule.year
    FROM `f1-analytics-platform.bronze.schedule` AS schedule
    CROSS JOIN UNNEST([
        STRUCT(schedule.Session1 AS session, TIMESTAMP_MICROS(CAST(schedule.Session1DateUtc / 1000 AS INT64)) AS session_date),
        STRUCT(schedule.Session2 AS session, TIMESTAMP_MICROS(CAST(schedule.Session2DateUtc / 1000 AS INT64)) AS session_date),
        STRUCT(schedule.Session3 AS session, TIMESTAMP_MICROS(CAST(schedule.Session3DateUtc / 1000 AS INT64)) AS session_date),
        STRUCT(schedule.Session4 AS session, TIMESTAMP_MICROS(CAST(schedule.Session4DateUtc / 1000 AS INT64)) AS session_date),
        STRUCT(schedule.Session5 AS session, TIMESTAMP_MICROS(CAST(schedule.Session5DateUtc / 1000 AS INT64)) AS session_date)
    ]) x
    WHERE schedule.RoundNumber > 0
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
            ELSE UPPER(REGEXP_REPLACE(session, r'(\w)\w*\s*', r'\1'))
        END AS session,
        session_date,
        year
    FROM gp_sessions
    WHERE session_date <= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 3 HOUR)
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
    FROM `f1-analytics-platform.bronze.results`
  ) results
  ON results.year = sessions.year AND results.gp = sessions.gp AND results.session = sessions.session
LEFT JOIN 
  (
    SELECT DISTINCT year, gp, session 
    FROM `f1-analytics-platform.bronze.laps`
  ) laps
  ON laps.year = sessions.year AND laps.gp = sessions.gp AND laps.session = sessions.session
WHERE 
  results.year IS NULL 
  OR (
    sessions.year >= 2018
    AND laps.year IS NULL 
    AND NOT EXISTS (
      SELECT 1 
      FROM `f1-analytics-platform.bronze.results` r 
      WHERE r.year = sessions.year 
        AND r.gp = sessions.gp 
        AND r.session = sessions.session
        AND (r.Laps IS NULL OR r.Laps = 0)
    )
  );
