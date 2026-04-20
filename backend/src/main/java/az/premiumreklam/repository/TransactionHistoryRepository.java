package az.premiumreklam.repository;

import az.premiumreklam.entity.TransactionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionHistoryRepository extends JpaRepository<TransactionHistory, Long> {
    List<TransactionHistory> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<TransactionHistory> findTop100ByOrderByCreatedAtDesc();
}

