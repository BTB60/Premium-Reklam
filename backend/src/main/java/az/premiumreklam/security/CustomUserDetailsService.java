package az.premiumreklam.security;

import az.premiumreklam.entity.Subadmin;
import az.premiumreklam.entity.User;
import az.premiumreklam.enums.UserStatus;
import az.premiumreklam.repository.SubadminRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final SubadminRepository subadminRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String key = username != null ? username.trim() : "";
        if (key.isEmpty()) {
            throw new UsernameNotFoundException("İstifadəçi tapılmadı");
        }
        return userRepository.findByUsernameIgnoreCase(key)
                .map(this::toUserDetails)
                .or(() -> userRepository.findByEmailIgnoreCase(key).map(this::toUserDetails))
                .or(() -> subadminRepository.findByLoginIgnoreCase(key).map(this::subadminToUserDetails))
                .orElseThrow(() -> new UsernameNotFoundException("İstifadəçi tapılmadı"));
    }

    private UserDetails toUserDetails(User user) {
        boolean active = user.getStatus() == UserStatus.ACTIVE;
        boolean locked = user.getStatus() == UserStatus.BLOCKED;
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                active,
                true,
                true,
                !locked,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getValue()))
        );
    }

    private UserDetails subadminToUserDetails(Subadmin subadmin) {
        String stored = subadmin.getPassword() != null ? subadmin.getPassword() : "";
        String encoded = stored;
        if (!looksLikeBcrypt(stored)) {
            // Legacy plain passwords are migrated at read time.
            encoded = passwordEncoder.encode(stored);
            subadmin.setPassword(encoded);
            subadminRepository.save(subadmin);
            log.info("Migrated legacy plain subadmin password hash for login={}", subadmin.getLogin());
        }
        return new org.springframework.security.core.userdetails.User(
                subadmin.getLogin(),
                encoded,
                List.of(new SimpleGrantedAuthority("ROLE_SUBADMIN"))
        );
    }

    private static boolean looksLikeBcrypt(String value) {
        return value != null && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }
}
