package az.premiumreklam.controller;

import az.premiumreklam.dto.support.SupportChatMessageRequest;
import az.premiumreklam.dto.support.SupportChatMessageResponse;
import az.premiumreklam.dto.support.SupportThreadSummaryResponse;
import az.premiumreklam.service.SupportChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/support-chat")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
public class AdminSupportChatController {

    private final SupportChatService supportChatService;

    @GetMapping("/threads")
    public List<SupportThreadSummaryResponse> threads() {
        return supportChatService.listThreadsForAdmin();
    }

    @GetMapping("/users/{userId}/messages")
    public List<SupportChatMessageResponse> listMessages(@PathVariable Long userId) {
        supportChatService.markUserMessagesReadByAdmin(userId);
        return supportChatService.listMessages(userId);
    }

    @PostMapping("/users/{userId}/messages")
    public SupportChatMessageResponse reply(
            @PathVariable Long userId,
            @RequestBody SupportChatMessageRequest body) {
        try {
            return supportChatService.postAdminMessage(userId, body);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
}
