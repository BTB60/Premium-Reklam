package az.premiumreklam.service;

import az.premiumreklam.dto.staff.CreateStaffRequest;
import az.premiumreklam.dto.staff.UpdateStaffRequest;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserRole;
import az.premiumreklam.enums.UserStatus;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffAdminService {

    private static final EnumSet<UserRole> STAFF_ROLES = EnumSet.of(UserRole.DIZAYNER, UserRole.USTA, UserRole.CHAPCI);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> listStaff() {
        return userRepository.findAll().stream()
                .filter(u -> STAFF_ROLES.contains(u.getRole()))
                .toList();
    }

    public boolean isStaffRole(UserRole role) {
        return role != null && STAFF_ROLES.contains(role);
    }

    @Transactional
    public User createStaff(CreateStaffRequest request) {
        if (!STAFF_ROLES.contains(request.getRole())) {
            throw new RuntimeException("Yalnız DIZAYNER, USTA və ya CHAPCI rol seçilə bilər");
        }
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new RuntimeException("Bu istifadəçi adı artıq mövcuddur");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new RuntimeException("Bu email artıq mövcuddur");
        }
        User user = User.builder()
                .fullName(request.getFullName().trim())
                .username(username)
                .email(email)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .status(UserStatus.ACTIVE)
                .build();
        return userRepository.save(user);
    }

    public User getStaffUserOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("İşçi tapılmadı"));
        if (!STAFF_ROLES.contains(user.getRole())) {
            throw new RuntimeException("Bu qeyd daxili işçi deyil");
        }
        return user;
    }

    @Transactional
    public User updateStaff(Long id, UpdateStaffRequest request) {
        User user = getStaffUserOrThrow(id);
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            String u = request.getUsername().trim();
            userRepository.findByUsernameIgnoreCase(u).ifPresent(other -> {
                if (!other.getId().equals(user.getId())) {
                    throw new RuntimeException("Bu istifadəçi adı artıq mövcuddur");
                }
            });
            user.setUsername(u);
        }
        if (request.getEmail() != null) {
            String e = request.getEmail().trim();
            if (e.isEmpty()) {
                user.setEmail(null);
            } else {
                userRepository.findByEmailIgnoreCase(e).ifPresent(other -> {
                    if (!other.getId().equals(user.getId())) {
                        throw new RuntimeException("Bu email artıq mövcuddur");
                    }
                });
                user.setEmail(e);
            }
        }
        if (request.getPhone() != null) {
            String p = request.getPhone().trim();
            user.setPhone(p.isEmpty() ? null : p);
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) {
            if (!STAFF_ROLES.contains(request.getRole())) {
                throw new RuntimeException("Yalnız DIZAYNER, USTA və ya CHAPCI rol seçilə bilər");
            }
            user.setRole(request.getRole());
        }
        return userRepository.save(user);
    }
}
