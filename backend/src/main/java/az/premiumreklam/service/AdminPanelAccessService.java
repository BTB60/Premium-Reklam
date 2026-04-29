package az.premiumreklam.service;

import az.premiumreklam.entity.Subadmin;
import az.premiumreklam.repository.SubadminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPanelAccessService {

    private final SubadminRepository subadminRepository;

    public boolean isAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch("ROLE_ADMIN"::equals);
    }

    public void requireAdminOrFeature(Authentication authentication, String feature, boolean editRequired) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "İcazə yoxdur");
        }
        if (isAdmin(authentication)) {
            return;
        }
        Subadmin subadmin = requireSubadmin(authentication);
        if (!featureSatisfied(subadmin, feature, editRequired)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu bölmə üçün icazə yoxdur");
        }
    }

    /**
     * Subadmin üçün: siyahıdakı istənilən bir xüsusiyyətə view və ya edit kifayət edir.
     */
    public void requireAdminOrAnyFeatureRead(Authentication authentication, String... features) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "İcazə yoxdur");
        }
        if (isAdmin(authentication)) {
            return;
        }
        Subadmin subadmin = requireSubadmin(authentication);
        boolean ok = Arrays.stream(features).anyMatch(f -> featureSatisfied(subadmin, f, false));
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu əməliyyat üçün icazə yoxdur");
        }
    }

    private Subadmin requireSubadmin(Authentication authentication) {
        boolean isSubadmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_SUBADMIN"::equals);
        if (!isSubadmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "İcazə yoxdur");
        }
        String login = authentication.getName();
        return subadminRepository.findByLoginIgnoreCase(login)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Subadmin tapılmadı"));
    }

    private static boolean featureSatisfied(Subadmin subadmin, String feature, boolean editRequired) {
        Map<String, String> perms = subadmin.getPermissions();
        String level = perms != null ? perms.getOrDefault(feature, "none") : "none";
        if (editRequired) {
            return "edit".equals(level);
        }
        return "view".equals(level) || "edit".equals(level);
    }
}
