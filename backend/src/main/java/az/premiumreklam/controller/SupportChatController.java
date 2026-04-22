package az.premiumreklam.controller;

import az.premiumreklam.dto.support.SupportChatMessageRequest;
import az.premiumreklam.dto.support.SupportChatMessageResponse;
import az.premiumreklam.entity.User;
import az.premiumreklam.repository.UserRepository;
import az.premiumreklam.service.SupportChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/support/chat")
@RequiredArgsConstructor
public class SupportChatController {

    private final SupportChatService supportChatService;
    private final UserRepository userRepository;

    @GetMapping("/messages")
    public List<SupportChatMessageResponse> listMessages(Authentication authentication) {
        User user = requireCustomerUser(authentication);
        supportChatService.markAdminMessagesReadByUser(user.getId());
        return supportChatService.listMessages(user.getId());
    }

    @PostMapping("/messages")
    public SupportChatMessageResponse sendMessage(
            Authentication authentication,
            @RequestBody SupportChatMessageRequest body) {
        User user = requireCustomerUser(authentication);
        try {
            return supportChatService.postUserMessage(user.getId(), body);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    private User requireCustomerUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Giriş tələb olunur");
        }
        String name = authentication.getName();
        return userRepository.findByUsernameIgnoreCase(name)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Canlı dəstək yalnız müştəri hesabı ilə mövcuddur"));
    }
}
