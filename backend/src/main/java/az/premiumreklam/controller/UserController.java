package az.premiumreklam.controller;

import az.premiumreklam.dto.auth.ChangePasswordRequest;
import az.premiumreklam.dto.auth.ProfileUpdateRequest;
import az.premiumreklam.dto.user.LoyaltyBonusPercentRequest;
import az.premiumreklam.entity.User;
import az.premiumreklam.security.JwtService;
import az.premiumreklam.service.AuthService;
import az.premiumreklam.service.UserDeletionService;
import az.premiumreklam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;
    private final UserDeletionService userDeletionService;
    private final AuthService authService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/profile/me")
    public Map<String, Object> getMyProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        User u = requireUserFromBearer(authorization);
        return profilePayload(u);
    }

    @PutMapping("/profile/me")
    public Map<String, Object> updateMyProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody ProfileUpdateRequest body) {
        User u = requireUserFromBearer(authorization);
        try {
            User updated = userService.updateProfile(u.getId(), body.getFullName(), body.getPhone(), body.getEmail());
            return profilePayload(updated);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/profile/me/password")
    public Map<String, String> changeMyPassword(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody ChangePasswordRequest body) {
        User u = requireUserFromBearer(authorization);
        try {
            authService.changeOwnPassword(u.getUsername(), body.getCurrentPassword(), body.getNewPassword());
            return Map.of("message", "Şifrə uğurla dəyişdirildi");
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PutMapping("/{id}/loyalty-bonus")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateUserLoyaltyBonus(
            @PathVariable Long id,
            @RequestBody LoyaltyBonusPercentRequest body) {
        try {
            User u = userService.updateLoyaltyBonusPercents(
                    id,
                    body != null ? body.getBonus500Percent() : null,
                    body != null ? body.getBonus1000Percent() : null);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("userId", u.getId());
            out.put("bonusLoyalty500Percent", u.getBonusLoyalty500Percent());
            out.put("bonusLoyalty1000Percent", u.getBonusLoyalty1000Percent());
            return out;
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication authentication) {
        String adminName = authentication != null ? authentication.getName() : "";
        try {
            userDeletionService.deleteNonAdminUser(id, adminName);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    private User requireUserFromBearer(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token tələb olunur");
        }
        String token = authHeader.substring(7).trim();
        if (!jwtService.validateToken(token) || jwtService.isTokenExpired(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token keçərsizdir");
        }
        String username = jwtService.extractUsername(token);
        return userService.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "İstifadəçi tapılmadı"));
    }

    private Map<String, Object> profilePayload(User u) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("userId", u.getId().toString());
        map.put("username", u.getUsername());
        map.put("fullName", u.getFullName());
        map.put("email", u.getEmail() != null ? u.getEmail() : "");
        map.put("phone", u.getPhone() != null ? u.getPhone() : "");
        map.put("role", u.getRole().getValue());
        map.put("totalDebt", u.getTotalDebt());
        map.put("orderBlocked", Boolean.TRUE.equals(u.getOrderBlocked()));
        map.put("nextWeeklyDueDate", u.getNextWeeklyDueDate());
        map.put("bonusLoyalty500Percent", u.getBonusLoyalty500Percent());
        map.put("bonusLoyalty1000Percent", u.getBonusLoyalty1000Percent());
        return map;
    }
}
