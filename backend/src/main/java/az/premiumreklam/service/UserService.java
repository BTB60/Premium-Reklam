package az.premiumreklam.service;

import az.premiumreklam.entity.User;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public User updateProfile(Long userId, String fullName, String phone, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }
        if (phone != null) {
            String p = phone.trim();
            user.setPhone(p.isEmpty() ? null : p);
        }
        if (email != null) {
            String e = email.trim();
            if (e.isEmpty()) {
                user.setEmail(null);
            } else {
                userRepository.findByEmail(e).ifPresent(other -> {
                    if (!other.getId().equals(user.getId())) {
                        throw new RuntimeException("Bu email artıq istifadə olunur");
                    }
                });
                user.setEmail(e);
            }
        }

        return userRepository.save(user);
    }
}
