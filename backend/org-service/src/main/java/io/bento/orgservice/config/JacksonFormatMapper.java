package io.bento.orgservice.config;

import org.hibernate.type.descriptor.WrapperOptions;
import org.hibernate.type.descriptor.java.JavaType;
import org.hibernate.type.format.FormatMapper;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/**
 * Hibernate JSON FormatMapper backed by Jackson 3 (tools.jackson).
 * <p>
 * Hibernate 7 auto-detects only com.fasterxml.jackson (Jackson 2) for JSON column mapping.
 * Since this project uses Jackson 3, we register this adapter explicitly via
 * {@code spring.jpa.properties.hibernate.type.json_format_mapper} in application.yaml.
 */
public class JacksonFormatMapper implements FormatMapper {

    private static final ObjectMapper MAPPER = JsonMapper.builder().findAndAddModules().build();

    @Override
    public <T> T fromString(CharSequence string, JavaType<T> javaType, WrapperOptions options) {
        if (string == null || string.isEmpty()) {
            return null;
        }
        return MAPPER.readValue(string.toString(), javaType.getJavaTypeClass());
    }

    @Override
    public <T> String toString(T value, JavaType<T> javaType, WrapperOptions options) {
        if (value == null) {
            return null;
        }
        return MAPPER.writeValueAsString(value);
    }
}
