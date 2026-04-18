package az.premiumreklam.security;

import az.premiumreklam.entity.Subadmin;
import az.premiumreklam.entity.User;
import az.premiumreklam.repository.SubadminRepository;
import az.premiumreklam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final SubadminRepository subadminRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .map(this::toUserDetails)
                .orElseGet(() -> subadminRepository.findByLogin(username)
                        .map(this::subadminToUserDetails)
                        .orElseThrow(() -> new UsernameNotFoundException("İstifadəçi tapılmadı")));
    }

    private UserDetails toUserDetails(User user) {
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }

    /**
     * Subadmin JWT uses login as subject; passwords in entity are stored as plain text today — use {noop} for Spring Security compatibility.
     */
    private UserDetails subadminToUserDetails(Subadmin subadmin) {
        String raw = subadmin.getPassword() != null ? subadmin.getPassword() : "";
        return new org.springframework.security.core.userdetails.User(
                subadmin.getLogin(),
                "{noop}" + raw,
                List.of(new SimpleGrantedAuthority("ROLE_SUBADMIN"))
        );
    }
}
