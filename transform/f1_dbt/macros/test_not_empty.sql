{% test not_empty(model, column_name) %}

SELECT
    *
FROM
    {{model}}
WHERE
    TRIM({{ column_name }}) = ''

{% endtest %}