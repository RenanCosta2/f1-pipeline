{% macro clean_null_string(column_name) %}

    NULLIF(
        NULLIF(
            NULLIF(
                NULLIF(
                    TRIM({{ column_name }}),
                    ''
                ),
                'nan'
            ),
            'None'
        ),
        'None None'
    ) AS {{ column_name }}

{% endmacro %}