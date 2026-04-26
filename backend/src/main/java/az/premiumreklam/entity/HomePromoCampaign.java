package az.premiumreklam.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "home_promo_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomePromoCampaign {

    @Id
    @Column(name = "campaign_key", nullable = false, length = 64)
    private String campaignKey;

    @Column(name = "campaign_type", nullable = false, length = 32)
    private String campaignType;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 200)
    private String cta;

    @Column(length = 200)
    private String badge;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(nullable = false, length = 300)
    private String color;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        updatedAt = OffsetDateTime.now();
        if (sortOrder == null) {
            sortOrder = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
