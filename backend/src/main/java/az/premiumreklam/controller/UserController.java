package az.premiumreklam.controller;

import az.premiumreklam.dto.auth.ProfileUpdateRequest;
import az.premiumreklam.entity.User;
import az.premiumreklam.security.JwtService;
import az.premiumreklam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
        return map;
    }
}
