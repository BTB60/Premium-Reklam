package az.premiumreklam.repository;

import az.premiumreklam.entity.SupportChatMessage;
import az.premiumreklam.enums.SupportSenderRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupportChatMessageRepository extends JpaRepository<SupportChatMessage, Long> {

    void deleteByUserId(Long userId);

    List<SupportChatMessage> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<SupportChatMessage> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndSenderRoleAndReadByAdminFalse(Long userId, SupportSenderRole senderRole);

    long countByUserIdAndSenderRoleAndReadByUserFalse(Long userId, SupportSenderRole senderRole);

    @Query("""
            SELECT m.userId FROM SupportChatMessage m
            GROUP BY m.userId
            ORDER BY MAX(m.createdAt) DESC
            """)
    List<Long> findUserIdsOrderByLatestMessageDesc();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE SupportChatMessage m SET m.readByUser = true WHERE m.userId = :userId AND m.senderRole = 'ADMIN' AND m.readByUser = false")
    int markAllFromAdminReadByUser(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE SupportChatMessage m SET m.readByAdmin = true WHERE m.userId = :userId AND m.senderRole = 'USER' AND m.readByAdmin = false")
    int markAllFromUserReadByAdmin(@Param("userId") Long userId);
}
