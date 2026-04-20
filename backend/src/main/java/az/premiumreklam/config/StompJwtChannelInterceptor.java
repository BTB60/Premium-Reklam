package az.premiumreklam.config;

import az.premiumreklam.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String h = authHeaders.get(0);
                if (h != null && h.startsWith("Bearer ")) {
                    String token = h.substring(7).trim();
                    try {
                        if (jwtService.validateToken(token) && !jwtService.isTokenExpired(token)) {
                            String username = jwtService.extractUsername(token);
                            UserDetails ud = userDetailsService.loadUserByUsername(username);
                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    ud, null, ud.getAuthorities());
                            accessor.setUser(auth);
                        }
                    } catch (Exception ignored) {
                        /* icazəsiz CONNECT — principal yoxdur */
                    }
                }
            }
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String dest = accessor.getDestination();
            if (dest != null && dest.startsWith("/topic/admin/")) {
                Authentication auth = (Authentication) accessor.getUser();
                if (auth == null || !isAdminOrSubadmin(auth)) {
                    throw new MessagingException("Bu kanala yalnız admin/subadmin abunə ola bilər");
                }
            }
        }

        return message;
    }

    private boolean isAdminOrSubadmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> {
            String r = a.getAuthority();
            return "ROLE_ADMIN".equals(r) || "ROLE_SUBADMIN".equals(r);
        });
    }
}
