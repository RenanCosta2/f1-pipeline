{% test not_null_time(model, column_name) %}

SELECT
    *
FROM
    {{ model }}
WHERE
    {{ column_name }} IS NOT NULL
    AND (
        {{ column_name }} = -9223372036854775808
        OR {{ column_name }} = -9223372036.855
        OR {{ column_name }} <= 0
    )

{% endtest %}
