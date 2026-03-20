package az.premiumreklam.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum OrderStatus {
    PENDING("pending"),
    APPROVED("approved"),
    CONFIRMED("confirmed"),
    DESIGN("design"),
    IN_PROGRESS("production"),
    PRINTING("printing"),
    READY("ready"),
    DELIVERING("delivering"),
    COMPLETED("completed"),
    CANCELLED("cancelled");

    private final String value;

    OrderStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    public static OrderStatus fromValue(String value) {
        if (value == null) return PENDING;
        for (OrderStatus status : values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        return PENDING;
    }
}
