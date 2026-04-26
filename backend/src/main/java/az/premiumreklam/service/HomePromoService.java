package az.premiumreklam.service;

import az.premiumreklam.dto.home.HomePromoCampaignRequest;
import az.premiumreklam.entity.HomePromoCampaign;
import az.premiumreklam.repository.HomePromoCampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HomePromoService {

    private final HomePromoCampaignRepository repository;

    public List<HomePromoCampaignRequest> getAll() {
        return repository.findAllByOrderBySortOrderAscCampaignKeyAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public List<HomePromoCampaignRequest> replaceAll(List<HomePromoCampaignRequest> requests) {
        repository.deleteAll();
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        List<HomePromoCampaign> saved = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            HomePromoCampaignRequest req = requests.get(i);
            String id = req.getId() == null ? "" : req.getId().trim();
            String title = req.getTitle() == null ? "" : req.getTitle().trim();
            String cta = req.getCta() == null ? "" : req.getCta().trim();
            if (id.isBlank() || title.isBlank() || cta.isBlank()) {
                continue;
            }
            String type = req.getType() == null ? "seasonal" : req.getType().trim();
            String color = req.getColor() == null ? "" : req.getColor().trim();
            if (color.isBlank()) {
                color = "from-[#D90429] to-[#EF476F]";
            }
            String badge = req.getBadge() == null || req.getBadge().isBlank() ? null : req.getBadge().trim();
            OffsetDateTime expires = parseExpires(req.getExpiresAtIso());

            HomePromoCampaign row = HomePromoCampaign.builder()
                    .campaignKey(id)
                    .campaignType(type)
                    .title(title)
                    .description(req.getDescription() == null ? "" : req.getDescription().trim())
                    .cta(cta)
                    .badge(badge)
                    .expiresAt(expires)
                    .color(color)
                    .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : i)
                    .build();
            saved.add(repository.save(row));
        }
        return saved.stream().map(this::toDto).toList();
    }

    private OffsetDateTime parseExpires(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(iso);
        } catch (DateTimeParseException e) {
            try {
                return java.time.Instant.parse(iso).atOffset(java.time.ZoneOffset.UTC);
            } catch (DateTimeParseException e2) {
                return null;
            }
        }
    }

    private HomePromoCampaignRequest toDto(HomePromoCampaign e) {
        HomePromoCampaignRequest dto = new HomePromoCampaignRequest();
        dto.setId(e.getCampaignKey());
        dto.setType(e.getCampaignType());
        dto.setTitle(e.getTitle());
        dto.setDescription(e.getDescription());
        dto.setCta(e.getCta());
        dto.setBadge(e.getBadge());
        dto.setExpiresAtIso(e.getExpiresAt() != null ? e.getExpiresAt().toInstant().toString() : null);
        dto.setColor(e.getColor());
        dto.setSortOrder(e.getSortOrder());
        return dto;
    }
}
