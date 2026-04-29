package az.premiumreklam.repository;

import az.premiumreklam.entity.WorkerTask;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkerTaskRepository extends JpaRepository<WorkerTask, Long> {
}
