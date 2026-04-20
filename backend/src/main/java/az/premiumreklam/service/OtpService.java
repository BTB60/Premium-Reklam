package az.premiumreklam.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OtpService {
    private static class OtpEntry {
        String code;
        LocalDateTime expiresAt;
    }

    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    public void sendOtp(String username, String purpose) {
        String key = key(username, purpose);
        OtpEntry entry = new OtpEntry();
        entry.code = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 999999));
        entry.expiresAt = LocalDateTime.now().plusMinutes(5);
        otpCache.put(key, entry);
        // TODO: integrate real SMS/email provider
        System.out.println("OTP [" + purpose + "] for " + username + ": " + entry.code);
    }

    public boolean verifyOtp(String username, String purpose, String code) {
        if (code == null || code.isBlank()) return false;
        String key = key(username, purpose);
        OtpEntry entry = otpCache.get(key);
        if (entry == null) return false;
        if (entry.expiresAt.isBefore(LocalDateTime.now())) {
            otpCache.remove(key);
            return false;
        }
        boolean ok = entry.code.equals(code.trim());
        if (ok) {
            otpCache.remove(key);
        }
        return ok;
    }

    private String key(String username, String purpose) {
        return username + "::" + purpose;
    }
}
