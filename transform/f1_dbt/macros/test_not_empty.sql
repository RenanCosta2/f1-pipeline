{% test not_empty(model, column_name) %}

SELECT
    *
FROM
    {{ model }}
WHERE
    TRIM(CAST({{ column_name }} AS STRING)) = ''
    OR LOWER(TRIM(CAST({{ column_name }} AS STRING))) IN ('nan', 'none', 'none none', 'null')

{% endtest %}
