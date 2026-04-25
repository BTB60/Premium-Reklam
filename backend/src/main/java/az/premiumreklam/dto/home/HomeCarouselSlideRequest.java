package az.premiumreklam.dto.home;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HomeCarouselSlideRequest {
    private String title;
    private String description;
    private String image;
    private Integer sortOrder;
    private Boolean isActive;
}
