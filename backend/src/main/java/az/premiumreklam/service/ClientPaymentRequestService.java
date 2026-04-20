package az.premiumreklam.service;

import az.premiumreklam.dto.payment.ClientPaymentRequestResponse;
import az.premiumreklam.dto.realtime.RealtimeEventDto;
import az.premiumreklam.entity.ClientPaymentRequest;
import az.premiumreklam.entity.InAppNotification;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.ClientPaymentRequestStatus;
import az.premiumreklam.enums.InAppNotificationType;
import az.premiumreklam.repository.ClientPaymentRequestRepository;
import az.premiumreklam.repository.InAppNotificationRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientPaymentRequestService {

    private final ClientPaymentRequestRepository paymentRequestRepository;
    private final UserRepository userRepository;
    private final InAppNotificationRepository notificationRepository;
    private final RealtimePushService realtimePushService;

    @Transactional
    public ClientPaymentRequestResponse createForCustomer(
            String username,
            BigDecimal amount,
            String receiptImageData,
            String receiptFileName
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Məbləğ müsbət olmalıdır");
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        ClientPaymentRequest pr = ClientPaymentRequest.builder()
                .user(user)
                .amount(amount)
                .receiptImageData(receiptImageData)
                .receiptFileName(receiptFileName)
                .status(ClientPaymentRequestStatus.PENDING)
                .build();
        pr = paymentRequestRepository.save(pr);

        realtimePushService.notifyAdmins(RealtimeEventDto.builder()
                .event("PAYMENT_PENDING")
                .paymentRequestId(pr.getId())
                .message(user.getFullName() + " — yeni ödəniş sorğusu: " + amount + " AZN")
                .soundProfile("admin")
                .dedupeKey("pr-pending-" + pr.getId())
                .build());

        return ClientPaymentRequestResponse.from(pr);
    }

    @Transactional(readOnly = true)
    public List<ClientPaymentRequestResponse> listPending() {
        return paymentRequestRepository.findByStatusOrderByCreatedAtDesc(ClientPaymentRequestStatus.PENDING)
                .stream()
                .map(ClientPaymentRequestResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClientPaymentRequestResponse> listMine(String username) {
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));
        return paymentRequestRepository.findByUser_IdOrderByCreatedAtDesc(u.getId())
                .stream()
                .map(ClientPaymentRequestResponse::from)
                .toList();
    }

    @Transactional
    public ClientPaymentRequestResponse approve(Long id) {
        ClientPaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sorğu tapılmadı"));
        if (pr.getStatus() != ClientPaymentRequestStatus.PENDING) {
            throw new IllegalStateException("Sorğu artıq emal olunub");
        }

        User user = userRepository.findById(pr.getUser().getId())
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        pr.setStatus(ClientPaymentRequestStatus.APPROVED);
        paymentRequestRepository.save(pr);

        BigDecimal debt = user.getTotalDebt() != null ? user.getTotalDebt() : BigDecimal.ZERO;
        BigDecimal amt = pr.getAmount();
        BigDecimal newDebt = debt.subtract(amt);
        if (newDebt.compareTo(BigDecimal.ZERO) < 0) {
            newDebt = BigDecimal.ZERO;
        }
        user.setTotalDebt(newDebt);
        if (newDebt.compareTo(BigDecimal.ZERO) == 0) {
            user.setOrderBlocked(false);
            user.setNextWeeklyDueDate(null);
        } else {
            user.setNextWeeklyDueDate(LocalDate.now().plusDays(7));
        }
        userRepository.save(user);

        InAppNotification n = InAppNotification.builder()
                .user(user)
                .message("Ödənişiniz təsdiqləndi: " + amt + " AZN. Cari borc: " + newDebt + " AZN.")
                .isRead(false)
                .type(InAppNotificationType.PAYMENT_APPROVED)
                .build();
        n = notificationRepository.save(n);

        realtimePushService.notifyUser(user.getUsername(), RealtimeEventDto.builder()
                .event("PAYMENT_APPROVED")
                .notificationId(n.getId())
                .paymentRequestId(pr.getId())
                .message(n.getMessage())
                .soundProfile("user")
                .dedupeKey("notif-" + n.getId())
                .build());

        return ClientPaymentRequestResponse.from(pr);
    }

    @Transactional
    public ClientPaymentRequestResponse reject(Long id) {
        ClientPaymentRequest pr = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sorğu tapılmadı"));
        if (pr.getStatus() != ClientPaymentRequestStatus.PENDING) {
            throw new IllegalStateException("Sorğu artıq emal olunub");
        }
        pr.setStatus(ClientPaymentRequestStatus.REJECTED);
        paymentRequestRepository.save(pr);

        User user = userRepository.findById(pr.getUser().getId())
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        InAppNotification n = InAppNotification.builder()
                .user(user)
                .message("Ödəniş sorğunuz rədd edildi: " + pr.getAmount() + " AZN")
                .isRead(false)
                .type(InAppNotificationType.PAYMENT_REJECTED)
                .build();
        n = notificationRepository.save(n);

        realtimePushService.notifyUser(user.getUsername(), RealtimeEventDto.builder()
                .event("PAYMENT_REJECTED")
                .notificationId(n.getId())
                .paymentRequestId(pr.getId())
                .message(n.getMessage())
                .soundProfile("user")
                .dedupeKey("notif-" + n.getId())
                .build());

        return ClientPaymentRequestResponse.from(pr);
    }
}
