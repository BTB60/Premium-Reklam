package az.premiumreklam.dto.worker;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin paneldəki tapşırıq forması ilə uyğun JSON (frontend camelCase).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerTaskPayload {
    private String title;
    private String description;
    /** Təyin olunan işçi — users.id */
    private Long assignedTo;
    private String assignedToName;
    private String status;
    private String priority;
    /** ISO-8601 mətn (məs. 2026-04-28T15:30:00) və ya null */
    private String dueDate;
    private String workStartedAt;
    private Long orderId;
    private String orderNumber;
    private String note;
}
