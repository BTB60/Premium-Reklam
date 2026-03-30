package az.premiumreklam.service;

import az.premiumreklam.entity.AnnouncementRead;
import az.premiumreklam.repository.AnnouncementReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnnouncementReadService {

    private final AnnouncementReadRepository announcementReadRepository;

    @Transactional
    public void markAsRead(UUID userId, Long announcementId) {
        if (!announcementReadRepository.existsByUserIdAndAnnouncementId(userId, announcementId)) {
            AnnouncementRead read = AnnouncementRead.builder()
                .userId(userId)
                .announcementId(announcementId)
                .build();
            announcementReadRepository.save(read);
        }
    }

    public boolean hasRead(UUID userId, Long announcementId) {
        return announcementReadRepository.existsByUserIdAndAnnouncementId(userId, announcementId);
    }
}