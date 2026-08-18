{% macro clean_null_time(column_name) %}

    NULLIF(
        {{ column_name }},
        -9223372036854775808
    ) AS {{ column_name }}

{% endmacro %}