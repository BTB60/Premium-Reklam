package az.premiumreklam.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum UserRole {
    ADMIN("ADMIN"),
    KASSIR("KASSIR"),
    MUHASIB("MUHASIB"),
    /** Dekorçu portal istifadəçisi (köhnə cavabda DECORATOR kimi görünür). */
    DECORCU("DECORATOR"),
    DECORATOR("DECORATOR"),
    /** Reklamçı hesabı — qeydiyyatda ayrıca seçilir. */
    REKLAMCI("REKLAMCI"),
    VENDOR("VENDOR"),
    /** Daxili işçi rolları — yalnız admin/subadmin yaradır. */
    DIZAYNER("DIZAYNER"),
    USTA("USTA"),
    CHAPCI("CHAPCI");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
