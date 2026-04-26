package az.premiumreklam.repository;

import az.premiumreklam.entity.HomePromoCampaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HomePromoCampaignRepository extends JpaRepository<HomePromoCampaign, String> {

    List<HomePromoCampaign> findAllByOrderBySortOrderAscCampaignKeyAsc();
}
