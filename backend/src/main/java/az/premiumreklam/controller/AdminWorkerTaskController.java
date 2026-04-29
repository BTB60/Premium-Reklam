package az.premiumreklam.controller;

import az.premiumreklam.dto.worker.WorkerTaskPayload;
import az.premiumreklam.dto.worker.WorkerTaskResponse;
import az.premiumreklam.service.AdminPanelAccessService;
import az.premiumreklam.service.WorkerTaskAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/worker-tasks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
public class AdminWorkerTaskController {

    private final WorkerTaskAdminService workerTaskAdminService;
    private final AdminPanelAccessService adminPanelAccessService;

    @GetMapping
    public List<WorkerTaskResponse> list(Authentication authentication) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "tasks", false);
        return workerTaskAdminService.listAll();
    }

    @GetMapping("/{id}")
    public WorkerTaskResponse getOne(Authentication authentication, @PathVariable Long id) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "tasks", false);
        try {
            return workerTaskAdminService.getById(id);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<WorkerTaskResponse> create(
            Authentication authentication,
            @RequestBody WorkerTaskPayload body) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "tasks", true);
        try {
            return ResponseEntity.ok(workerTaskAdminService.create(body));
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    public WorkerTaskResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody WorkerTaskPayload body) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "tasks", true);
        try {
            return workerTaskAdminService.update(id, body);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PatchMapping("/{id}")
    public WorkerTaskResponse patchStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "tasks", true);
        String status = body != null ? body.get("status") : null;
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status tələb olunur");
        }
        try {
            return workerTaskAdminService.patchStatus(id, status);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long id) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "tasks", true);
        workerTaskAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
