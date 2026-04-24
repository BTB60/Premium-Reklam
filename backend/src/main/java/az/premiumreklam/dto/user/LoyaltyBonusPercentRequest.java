package az.premiumreklam.dto.user;

import lombok.Data;

/**
 * 500 / 1000 AZN ümumi sifariş hədləri üçün fərdi faizlər.
 * null = bu müştəri üçün ümumi (default) ayarlar istifadə olunur.
 */
@Data
public class LoyaltyBonusPercentRequest {
    private Integer bonus500Percent;
    private Integer bonus1000Percent;
}
