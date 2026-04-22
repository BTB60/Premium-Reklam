package az.premiumreklam.service;

import az.premiumreklam.entity.Order;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDeletionService {

    private final UserRepository userRepository;
    private final UserPriceRepository userPriceRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InAppNotificationRepository inAppNotificationRepository;
    private final ClientPaymentRequestRepository clientPaymentRequestRepository;
    private final TransactionHistoryRepository transactionHistoryRepository;
    private final VendorStoreRequestRepository vendorStoreRequestRepository;
    private final SupportChatMessageRepository supportChatMessageRepository;

    @Transactional
    public void deleteNonAdminUser(Long userId, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        if (user.getRole() == UserRole.ADMIN) {
            throw new RuntimeException("Admin hesabı silinə bilməz");
        }

        String adminKey = adminUsername != null ? adminUsername.trim() : "";
        if (!adminKey.isEmpty() && user.getUsername() != null
                && user.getUsername().equalsIgnoreCase(adminKey)) {
            throw new RuntimeException("Öz hesabınızı silə bilməzsiniz");
        }

        Long uid = user.getId();

        userPriceRepository.deleteByUser_Id(uid);
        inAppNotificationRepository.deleteByUser_Id(uid);
        clientPaymentRequestRepository.deleteByUser_Id(uid);
        transactionHistoryRepository.deleteByUser_Id(uid);
        vendorStoreRequestRepository.deleteByUser_Id(uid);
        supportChatMessageRepository.deleteByUserId(uid);

        List<Order> orders = orderRepository.findByUser_Id(uid);
        for (Order o : orders) {
            paymentRepository.deleteByOrder_Id(o.getId());
        }
        orderRepository.deleteAll(orders);

        paymentRepository.deleteByUser_Id(uid);

        userRepository.delete(user);
    }
}
