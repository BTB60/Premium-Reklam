package az.premiumreklam.repository;

import az.premiumreklam.entity.AnnouncementRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, UUID> {
    
    Optional<AnnouncementRead> findByUserIdAndAnnouncementId(UUID userId, Long announcementId);
    
    boolean existsByUserIdAndAnnouncementId(UUID userId, Long announcementId);
}