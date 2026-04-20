package az.premiumreklam.service;

import az.premiumreklam.dto.realtime.RealtimeEventDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RealtimePushService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyAdmins(RealtimeEventDto payload) {
        messagingTemplate.convertAndSend("/topic/admin/payment-events", payload);
    }

    public void notifyUser(String username, RealtimeEventDto payload) {
        messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
    }
}
