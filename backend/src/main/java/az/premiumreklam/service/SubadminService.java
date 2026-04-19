package az.premiumreklam.service;

import az.premiumreklam.entity.Subadmin;
import az.premiumreklam.repository.SubadminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubadminService {
    private final SubadminRepository subadminRepository;

    public List<Subadmin> getAll() {
        return subadminRepository.findAll();
    }

    public Optional<Subadmin> getById(Long id) {
        return subadminRepository.findById(id);
    }

    public Subadmin create(Subadmin subadmin) {
        if (subadminRepository.existsByLogin(subadmin.getLogin())) {
            throw new RuntimeException("Subadmin with this login already exists");
        }
        return subadminRepository.save(subadmin);
    }

    public Subadmin update(Long id, Subadmin updated) {
        return subadminRepository.findById(id).map(existing -> {
            existing.setLogin(updated.getLogin());
            existing.setPassword(updated.getPassword());
            existing.setPermissions(updated.getPermissions());
            return subadminRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Subadmin not found"));
    }

    public void delete(Long id) {
        subadminRepository.deleteById(id);
    }

    public Optional<Subadmin> authenticate(String login, String password) {
        return subadminRepository.findByLogin(login)
                .filter(subadmin -> subadmin.getPassword().equals(password));
    }

    public void updateLastLogin(Long id) {
        subadminRepository.findById(id).ifPresent(subadmin -> {
            subadmin.setLastLogin(LocalDateTime.now());
            subadminRepository.save(subadmin);
        });
    }

    public Map<String, String> defaultPermissions() {
        Map<String, String> perms = new HashMap<>();
        perms.put("users", "none");
        perms.put("orders", "none");
        perms.put("finance", "none");
        perms.put("products", "none");
        perms.put("inventory", "none");
        perms.put("tasks", "none");
        perms.put("support", "none");
        perms.put("analytics", "none");
        perms.put("settings", "none");
        return perms;
    }
}
