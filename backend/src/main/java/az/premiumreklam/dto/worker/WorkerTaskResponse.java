package az.premiumreklam.dto.worker;

import az.premiumreklam.entity.User;
import az.premiumreklam.entity.WorkerTask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerTaskResponse {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private Long id;
    private String title;
    private String description;
    private String assignedTo;
    private String assignedToName;
    private String status;
    private String priority;
    private String dueDate;
    private String workStartedAt;
    private Long orderId;
    private String orderNumber;
    private String note;
    private String createdAt;
    private String completedAt;

    public static WorkerTaskResponse fromEntity(WorkerTask t) {
        User assignee = t.getAssignedTo();
        return WorkerTaskResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .assignedTo(assignee != null ? String.valueOf(assignee.getId()) : null)
                .assignedToName(assignee != null ? assignee.getFullName() : null)
                .status(t.getStatus())
                .priority(t.getPriority())
                .dueDate(formatDt(t.getDueDate()))
                .workStartedAt(formatDt(t.getWorkStartedAt()))
                .orderId(t.getLinkedOrder() != null ? t.getLinkedOrder().getId() : null)
                .orderNumber(t.getOrderNumber())
                .note(t.getNote())
                .createdAt(formatDt(t.getCreatedAt()))
                .completedAt(formatDt(t.getCompletedAt()))
                .build();
    }

    private static String formatDt(LocalDateTime dt) {
        return dt == null ? null : ISO.format(dt);
    }
}
