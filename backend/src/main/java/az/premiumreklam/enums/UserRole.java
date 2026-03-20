package az.premiumreklam.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum UserRole {
    ADMIN("ADMIN"),
    KASSIR("KASSIR"),
    MUHASIB("MUHASIB"),
    DECORCU("DECORATOR"),
    DECORATOR("DECORATOR"),
    VENDOR("VENDOR");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
