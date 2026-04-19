package az.premiumreklam.repository;

import az.premiumreklam.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Override
    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    List<Order> findAll();

    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    List<Order> findByUser_Id(Long userId);

    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findWithDetailsById(@Param("id") Long id);
}
