package az.premiumreklam.entity;

import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.UserStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(unique = true, length = 120)
    private String email;

    @Column(length = 30)
    private String phone;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false, columnDefinition = "TEXT")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.DECORCU;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "monthly_target", precision = 12, scale = 2, nullable = false)
    private BigDecimal monthlyTarget = BigDecimal.valueOf(500);

    @Column(name = "monthly_sales_total", precision = 12, scale = 2, nullable = false)
    private BigDecimal monthlySalesTotal = BigDecimal.ZERO;

    @Column(name = "discount_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    /** Ümumi borc (daxili valyuta, məs. AZN). Ödəniş təsdiqi ilə azalır. */
    @Column(name = "total_debt", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalDebt = BigDecimal.ZERO;

    /** Həftəlik ödəniş gecikməsinə görə sifariş bloku. */
    @Column(name = "order_blocked", nullable = false)
    private Boolean orderBlocked = false;

    /** Növbəti həftəlik ödəniş üçün son tarix. */
    @Column(name = "next_weekly_due_date")
    private LocalDate nextWeeklyDueDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @JsonIgnore
    @Column(name = "reset_token")
    private String resetToken;

    @JsonIgnore
    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (monthlyTarget == null) monthlyTarget = BigDecimal.valueOf(500);
        if (monthlySalesTotal == null) monthlySalesTotal = BigDecimal.ZERO;
        if (discountPercent == null) discountPercent = BigDecimal.ZERO;
        if (totalDebt == null) totalDebt = BigDecimal.ZERO;
        if (orderBlocked == null) orderBlocked = false;
        if (role == null) role = UserRole.DECORCU;
        if (status == null) status = UserStatus.ACTIVE;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
