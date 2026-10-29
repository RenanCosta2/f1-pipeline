{% macro format_lap_time(seconds) %}
CASE 
    WHEN {{ seconds }} IS NULL THEN NULL
    ELSE FORMAT('%d:%06.3f', CAST(FLOOR(CAST({{ seconds }} AS FLOAT64) / 60) AS INT64), CAST({{ seconds }} AS FLOAT64) - FLOOR(CAST({{ seconds }} AS FLOAT64) / 60) * 60)
END
{% endmacro %}

{% macro format_race_time(seconds) %}
CASE 
    WHEN {{ seconds }} IS NULL THEN NULL
    WHEN CAST({{ seconds }} AS FLOAT64) >= 3600 THEN FORMAT('%d:%02d:%06.3f', CAST(FLOOR(CAST({{ seconds }} AS FLOAT64) / 3600) AS INT64), CAST(FLOOR((CAST({{ seconds }} AS FLOAT64) - FLOOR(CAST({{ seconds }} AS FLOAT64) / 3600) * 3600) / 60) AS INT64), CAST({{ seconds }} AS FLOAT64) - FLOOR(CAST({{ seconds }} AS FLOAT64) / 60) * 60)
    ELSE FORMAT('%d:%06.3f', CAST(FLOOR(CAST({{ seconds }} AS FLOAT64) / 60) AS INT64), CAST({{ seconds }} AS FLOAT64) - FLOOR(CAST({{ seconds }} AS FLOAT64) / 60) * 60)
END
{% endmacro %}

{% macro format_gap(seconds) %}
CASE 
    WHEN {{ seconds }} IS NULL THEN NULL
    WHEN CAST({{ seconds }} AS FLOAT64) >= 60 THEN CONCAT('+', FORMAT('%d:%06.3f', CAST(FLOOR(CAST({{ seconds }} AS FLOAT64) / 60) AS INT64), CAST({{ seconds }} AS FLOAT64) - FLOOR(CAST({{ seconds }} AS FLOAT64) / 60) * 60))
    ELSE CONCAT('+', FORMAT('%.3f', CAST({{ seconds }} AS FLOAT64)), 's')
END
{% endmacro %}
