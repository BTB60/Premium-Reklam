package az.premiumreklam.service;

import az.premiumreklam.dto.finance.FinanceBalanceUpdateRequest;
import az.premiumreklam.dto.finance.FinanceTransactionHistoryRow;
import az.premiumreklam.dto.finance.FinanceUserDebtRow;
import az.premiumreklam.dto.realtime.RealtimeEventDto;
import az.premiumreklam.entity.InAppNotification;
import az.premiumreklam.entity.TransactionHistory;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.FinanceTransactionType;
import az.premiumreklam.enums.InAppNotificationType;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.repository.InAppNotificationRepository;
import az.premiumreklam.repository.TransactionHistoryRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminFinanceService {

    private final UserRepository userRepository;
    private final TransactionHistoryRepository transactionHistoryRepository;
    private final InAppNotificationRepository inAppNotificationRepository;
    private final RealtimePushService realtimePushService;

    @Transactional(readOnly = true)
    public List<FinanceUserDebtRow> listDebts() {
        return userRepository.findAll().stream()
                .filter(this::isClientRole)
                .map(u -> FinanceUserDebtRow.builder()
                        .userId(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .totalDebt(u.getTotalDebt() == null ? BigDecimal.ZERO : u.getTotalDebt())
                        .build())
                .sorted(Comparator.comparing(FinanceUserDebtRow::getTotalDebt).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FinanceTransactionHistoryRow> listTransactions(Long userId) {
        if (userId != null) {
            return transactionHistoryRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                    .map(FinanceTransactionHistoryRow::from)
                    .toList();
        }
        return transactionHistoryRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(FinanceTransactionHistoryRow::from)
                .toList();
    }

    @Transactional
    public FinanceTransactionHistoryRow updateBalance(String actorUsername, FinanceBalanceUpdateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Məbləğ müsbət olmalıdır");
        }

        BigDecimal before = user.getTotalDebt() == null ? BigDecimal.ZERO : user.getTotalDebt();
        BigDecimal after;
        String userMessage;
        String event;
        InAppNotificationType notificationType;

        if (request.getTransactionType() == FinanceTransactionType.CREDIT) {
            after = before.subtract(amount);
            if (after.compareTo(BigDecimal.ZERO) < 0) {
                after = BigDecimal.ZERO;
            }
            userMessage = "Ödənişiniz qəbul edildi, borcunuzdan silindi: " + amount + " AZN.";
            event = "PAYMENT_ACCEPTED";
            notificationType = InAppNotificationType.PAYMENT_APPROVED;
        } else {
            after = before.add(amount);
            userMessage = "Hesabınıza " + amount + " AZN borc əlavə edildi. Cari borc: " + after + " AZN.";
            event = "DEBT_INCREASED";
            notificationType = InAppNotificationType.SYSTEM;
        }

        user.setTotalDebt(after);
        userRepository.save(user);

        TransactionHistory tx = transactionHistoryRepository.save(TransactionHistory.builder()
                .user(user)
                .transactionType(request.getTransactionType())
                .amount(amount)
                .balanceBefore(before)
                .balanceAfter(after)
                .performedBy(actorUsername)
                .note(request.getNote())
                .build());

        InAppNotification notification = inAppNotificationRepository.save(InAppNotification.builder()
                .user(user)
                .message(userMessage)
                .type(notificationType)
                .isRead(false)
                .build());

        realtimePushService.notifyUser(user.getUsername(), RealtimeEventDto.builder()
                .event(event)
                .notificationId(notification.getId())
                .message(userMessage)
                .soundProfile("user")
                .dedupeKey("notif-" + notification.getId())
                .build());

        return FinanceTransactionHistoryRow.from(tx);
    }

    private boolean isClientRole(User user) {
        UserRole role = user.getRole();
        return role == UserRole.DECORCU || role == UserRole.DECORATOR || role == UserRole.VENDOR;
    }
}

