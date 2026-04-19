package az.premiumreklam.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "subadmins")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subadmin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String login;

    @Column(nullable = false)
    private String password;

    @ElementCollection
    @CollectionTable(name = "subadmin_permissions", joinColumns = @JoinColumn(name = "subadmin_id"))
    @MapKeyColumn(name = "feature")
    @Column(name = "permission_level")
    private Map<String, String> permissions = new HashMap<>();

    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (permissions.isEmpty()) {
            permissions.put("users", "none");
            permissions.put("orders", "none");
            permissions.put("finance", "none");
            permissions.put("products", "none");
            permissions.put("inventory", "none");
            permissions.put("tasks", "none");
            permissions.put("support", "none");
            permissions.put("analytics", "none");
            permissions.put("settings", "none");
        }
    }
}
