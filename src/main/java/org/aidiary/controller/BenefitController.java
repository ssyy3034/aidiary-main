package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.response.BenefitDTO;
import org.aidiary.entity.User;
import org.aidiary.service.BenefitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/benefits")
@RequiredArgsConstructor
public class BenefitController {

    private final BenefitService benefitService;

    @GetMapping
    public ResponseEntity<List<BenefitDTO>> getBenefits(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int week) {
        return ResponseEntity.ok(benefitService.getBenefitsForWeek(user.getId(), week));
    }

    @PostMapping("/{benefitId}/check")
    public ResponseEntity<BenefitDTO> toggleCheck(
            @PathVariable Long benefitId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(benefitService.toggleBenefitCheck(user.getId(), benefitId));
    }
}
