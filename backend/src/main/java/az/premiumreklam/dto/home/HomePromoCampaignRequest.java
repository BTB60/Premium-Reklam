package az.premiumreklam.dto.home;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class HomePromoCampaignRequest {

    @JsonProperty("id")
    @JsonAlias("campaignKey")
    private String id;

    @JsonProperty("type")
    @JsonAlias("campaignType")
    private String type;

    private String title;
    private String description;
    private String cta;
    private String badge;
    /** ISO-8601 or null */
    private String expiresAtIso;
    private String color;
    private Integer sortOrder;
}
