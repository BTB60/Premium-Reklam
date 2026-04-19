package az.premiumreklam.repository;

import az.premiumreklam.entity.Subadmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubadminRepository extends JpaRepository<Subadmin, Long> {
    Optional<Subadmin> findByLogin(String login);
    boolean existsByLogin(String login);
}
