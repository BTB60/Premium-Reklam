package az.premiumreklam.service;

import az.premiumreklam.dto.realtime.RealtimeEventDto;
import az.premiumreklam.dto.support.SupportChatMessageRequest;
import az.premiumreklam.dto.support.SupportChatMessageResponse;
import az.premiumreklam.dto.support.SupportThreadSummaryResponse;
import az.premiumreklam.entity.SupportChatMessage;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.SupportSenderRole;
import az.premiumreklam.repository.SupportChatMessageRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SupportChatService {

    public static final long MAX_ATTACHMENT_BYTES = 4L * 1024 * 1024;

    private final SupportChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final RealtimePushService realtimePushService;

    @Transactional(readOnly = true)
    public List<SupportChatMessageResponse> listMessages(Long userId) {
        return messageRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(m -> SupportChatMessageResponse.fromEntity(m, true))
                .toList();
    }

    @Transactional
    public void markAdminMessagesReadByUser(Long userId) {
        messageRepository.markAllFromAdminReadByUser(userId);
    }

    @Transactional
    public void markUserMessagesReadByAdmin(Long userId) {
        messageRepository.markAllFromUserReadByAdmin(userId);
    }

    @Transactional
    public SupportChatMessageResponse postUserMessage(Long userId, SupportChatMessageRequest req) {
        return saveMessage(userId, SupportSenderRole.USER, req);
    }

    @Transactional
    public SupportChatMessageResponse postAdminMessage(Long userId, SupportChatMessageRequest req) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("İstifadəçi tapılmadı");
        }
        return saveMessage(userId, SupportSenderRole.ADMIN, req);
    }

    private SupportChatMessageResponse saveMessage(Long userId, SupportSenderRole role, SupportChatMessageRequest req) {
        String content = req.getContent() != null ? req.getContent().trim() : "";
        String b64 = req.getAttachmentBase64() != null ? req.getAttachmentBase64().trim() : "";
        if (content.isEmpty() && b64.isEmpty()) {
            throw new RuntimeException("Mesaj və ya əlavə fayl tələb olunur");
        }

        byte[] attachmentBytes = null;
        long sizeBytes = 0;
        if (!b64.isEmpty()) {
            String mime = normalizeMime(req.getAttachmentMimeType());
            if (!allowedMime(mime)) {
                throw new RuntimeException("Yalnız şəkil və ya video faylı qəbul edilir");
            }
            try {
                attachmentBytes = Base64.getDecoder().decode(b64);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Əlavə: base64 formatı düzgün deyil");
            }
            sizeBytes = attachmentBytes.length;
            if (sizeBytes > MAX_ATTACHMENT_BYTES) {
                throw new RuntimeException("Əlavə fayl 4 MB-dan böyük ola bilməz");
            }
        }

        String fileName = sanitizeFileName(req.getAttachmentFileName());
        String mimeStored = b64.isEmpty() ? null : normalizeMime(req.getAttachmentMimeType());

        SupportChatMessage msg = SupportChatMessage.builder()
                .userId(userId)
                .senderRole(role)
                .content(content)
                .attachmentBase64(b64.isEmpty() ? null : b64)
                .attachmentMimeType(mimeStored)
                .attachmentFileName(fileName)
                .attachmentSizeBytes(b64.isEmpty() ? null : sizeBytes)
                .createdAt(Instant.now())
                .readByUser(role == SupportSenderRole.USER)
                .readByAdmin(role == SupportSenderRole.ADMIN)
                .build();

        SupportChatMessage saved = messageRepository.save(msg);

        if (role == SupportSenderRole.USER) {
            userRepository.findById(userId).ifPresent(u -> realtimePushService.notifyAdmins(
                    RealtimeEventDto.builder()
                            .event("SUPPORT_MESSAGE")
                            .message("Dəstək — " + u.getFullName() + ": " + preview(saved))
                            .soundProfile("admin")
                            .dedupeKey("support-in-" + saved.getId())
                            .build()));
        } else {
            userRepository.findById(userId).ifPresent(u -> realtimePushService.notifyUser(
                    u.getUsername(),
                    RealtimeEventDto.builder()
                            .event("SUPPORT_REPLY")
                            .message("Dəstək cavabı: " + preview(saved))
                            .soundProfile("user")
                            .dedupeKey("support-out-" + saved.getId())
                            .build()));
        }

        return SupportChatMessageResponse.fromEntity(saved, true);
    }

    @Transactional(readOnly = true)
    public List<SupportThreadSummaryResponse> listThreadsForAdmin() {
        List<Long> userIds = messageRepository.findUserIdsOrderByLatestMessageDesc();
        List<SupportThreadSummaryResponse> out = new ArrayList<>();
        for (Long uid : userIds) {
            Optional<User> userOpt = userRepository.findById(uid);
            Optional<SupportChatMessage> lastOpt = messageRepository.findTopByUserIdOrderByCreatedAtDesc(uid);
            if (lastOpt.isEmpty()) {
                continue;
            }
            SupportChatMessage last = lastOpt.get();
            long unread = messageRepository.countByUserIdAndSenderRoleAndReadByAdminFalse(uid, SupportSenderRole.USER);
            String preview = preview(last);
            SupportThreadSummaryResponse row = SupportThreadSummaryResponse.builder()
                    .userId(uid)
                    .username(userOpt.map(User::getUsername).orElse(""))
                    .fullName(userOpt.map(User::getFullName).orElse(""))
                    .lastPreview(preview)
                    .lastMessageAt(last.getCreatedAt())
                    .unreadForAdmin(unread)
                    .build();
            out.add(row);
        }
        return out;
    }

    private static String preview(SupportChatMessage last) {
        if (last.getContent() != null && !last.getContent().isBlank()) {
            String t = last.getContent().trim();
            return t.length() > 120 ? t.substring(0, 117) + "…" : t;
        }
        if (last.getAttachmentMimeType() != null && last.getAttachmentMimeType().toLowerCase(Locale.ROOT).startsWith("video/")) {
            return "[Video]";
        }
        if (last.getAttachmentBase64() != null && !last.getAttachmentBase64().isBlank()) {
            return "[Şəkil]";
        }
        return "";
    }

    private static String normalizeMime(String mime) {
        if (mime == null) return "";
        return mime.trim();
    }

    private static boolean allowedMime(String mime) {
        if (mime.isEmpty()) return false;
        String m = mime.toLowerCase(Locale.ROOT);
        return m.startsWith("image/") || m.startsWith("video/");
    }

    private static String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) return null;
        String n = name.trim().replace("\\", "/");
        int slash = n.lastIndexOf('/');
        if (slash >= 0 && slash < n.length() - 1) {
            n = n.substring(slash + 1);
        }
        if (n.length() > 255) {
            n = n.substring(0, 255);
        }
        return n.isEmpty() ? null : n;
    }
}
