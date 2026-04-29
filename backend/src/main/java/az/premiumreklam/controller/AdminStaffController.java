package az.premiumreklam.controller;

import az.premiumreklam.dto.staff.CreateStaffRequest;
import az.premiumreklam.dto.staff.UpdateStaffRequest;
import az.premiumreklam.entity.User;
import az.premiumreklam.service.AdminPanelAccessService;
import az.premiumreklam.service.StaffAdminService;
import az.premiumreklam.service.UserDeletionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
public class AdminStaffController {

    private final StaffAdminService staffAdminService;
    private final AdminPanelAccessService adminPanelAccessService;
    private final UserDeletionService userDeletionService;

    /**
     * İşçi siyahısı: istifadəçilər bölməsinə və ya tapşırıqlara baxan subadmin də görə bilər
     * (təyinat siyahısı üçün).
     */
    @GetMapping
    public List<User> list(Authentication authentication) {
        adminPanelAccessService.requireAdminOrAnyFeatureRead(authentication, "users", "tasks");
        return staffAdminService.listStaff();
    }

    @PostMapping
    public ResponseEntity<User> create(
            Authentication authentication,
            @Valid @RequestBody CreateStaffRequest body) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "users", true);
        try {
            return ResponseEntity.ok(staffAdminService.createStaff(body));
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    public User update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffRequest body) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "users", true);
        try {
            return staffAdminService.updateStaff(id, body);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable Long id) {
        adminPanelAccessService.requireAdminOrFeature(authentication, "users", true);
        User user;
        try {
            user = staffAdminService.getStaffUserOrThrow(id);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
        String actor = authentication != null ? authentication.getName() : "";
        try {
            userDeletionService.deleteNonAdminUser(user.getId(), actor);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
}
