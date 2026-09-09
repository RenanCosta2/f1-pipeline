{% test not_empty(model, column_name) %}

SELECT
    *
FROM
    {{ model }}
WHERE
    TRIM({{ column_name }}::TEXT) = ''
    OR LOWER(TRIM({{ column_name }}::TEXT)) IN ('nan', 'none', 'none none', 'null')

{% endtest %}