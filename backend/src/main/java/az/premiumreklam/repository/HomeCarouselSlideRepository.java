package az.premiumreklam.repository;

import az.premiumreklam.entity.HomeCarouselSlide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeCarouselSlideRepository extends JpaRepository<HomeCarouselSlide, Long> {
    List<HomeCarouselSlide> findAllByOrderBySortOrderAscIdAsc();
    List<HomeCarouselSlide> findByIsActiveTrueOrderBySortOrderAscIdAsc();
}
