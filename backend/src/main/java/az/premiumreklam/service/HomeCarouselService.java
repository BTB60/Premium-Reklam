package az.premiumreklam.service;

import az.premiumreklam.dto.home.HomeCarouselSlideRequest;
import az.premiumreklam.entity.HomeCarouselSlide;
import az.premiumreklam.repository.HomeCarouselSlideRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeCarouselService {

    private final HomeCarouselSlideRepository repository;

    public List<HomeCarouselSlide> getActive() {
        return repository.findByIsActiveTrueOrderBySortOrderAscIdAsc();
    }

    public List<HomeCarouselSlide> getAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional
    public List<HomeCarouselSlide> replaceAll(List<HomeCarouselSlideRequest> requests) {
        repository.deleteAll();
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        for (int i = 0; i < requests.size(); i++) {
            HomeCarouselSlideRequest req = requests.get(i);
            String title = req.getTitle() == null ? "" : req.getTitle().trim();
            String image = req.getImage() == null ? "" : req.getImage().trim();
            if (title.isBlank() || image.isBlank()) {
                continue;
            }
            repository.save(HomeCarouselSlide.builder()
                    .title(title)
                    .description(req.getDescription() == null ? "" : req.getDescription().trim())
                    .image(image)
                    .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : i)
                    .isActive(req.getIsActive() == null || req.getIsActive())
                    .build());
        }
        return getAll();
    }
}
