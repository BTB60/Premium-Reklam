package az.premiumreklam.controller;

import az.premiumreklam.dto.finance.FinanceBalanceUpdateRequest;
import az.premiumreklam.dto.finance.FinanceTransactionHistoryRow;
import az.premiumreklam.dto.finance.FinanceUserDebtRow;
import az.premiumreklam.service.AdminFinanceService;
import az.premiumreklam.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final AdminFinanceService adminFinanceService;
    private final OtpService otpService;

    @GetMapping("/debts")
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public List<FinanceUserDebtRow> debts() {
        return adminFinanceService.listDebts();
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','SUBADMIN')")
    public List<FinanceTransactionHistoryRow> transactions(@RequestParam(required = false) Long userId) {
        return adminFinanceService.listTransactions(userId);
    }

    @PostMapping("/update-balance")
    @PreAuthorize("hasRole('ADMIN')")
    public FinanceTransactionHistoryRow updateBalance(@Valid @RequestBody FinanceBalanceUpdateRequest request,
                                                      Authentication authentication,
                                                      @RequestHeader(value = "X-OTP-Code", required = false) String otpCode) {
        if (!otpService.verifyOtp(authentication.getName(), "FINANCE_ACTION", otpCode)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Maliyyə əməliyyatı üçün OTP tələb olunur"
            );
        }
        return adminFinanceService.updateBalance(authentication.getName(), request);
    }

    @PostMapping("/users/{userId}/unblock-order")
    @PreAuthorize("hasRole('ADMIN')")
    public void unblockOrder(@PathVariable Long userId,
                             Authentication authentication,
                             @RequestHeader(value = "X-OTP-Code", required = false) String otpCode) {
        if (!otpService.verifyOtp(authentication.getName(), "FINANCE_ACTION", otpCode)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Blok açma üçün OTP tələb olunur"
            );
        }
        adminFinanceService.unblockOrderForUser(userId);
    }
}

