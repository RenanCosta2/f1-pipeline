{% macro clean_null_time(column_name) %}

    CASE 
        WHEN {{ column_name }} IS NULL 
          OR {{ column_name }} = -9223372036854775808 
          OR {{ column_name }} <= 0 
        THEN NULL
        ELSE {{ column_name }}
    END AS {{ column_name }}

{% endmacro %}