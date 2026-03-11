package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.response.BenefitDTO;
import org.aidiary.entity.User;
import org.aidiary.service.BenefitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/benefits")
@RequiredArgsConstructor
@Tag(name = "Benefit API", description = "임신/출산 혜택 관리 API")
public class BenefitController {

    private final BenefitService benefitService;

    @Operation(summary = "주차별 혜택 목록 조회", description = "해당 주차에 받을 수 있는 혜택 목록과 사용자의 체크 여부를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping
    public ResponseEntity<List<BenefitDTO>> getBenefits(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "1") int week) {
        return ResponseEntity.ok(benefitService.getBenefitsForWeek(user.getId(), week));
    }

    @Operation(summary = "혜택 체크 상태 토글", description = "특정 혜택의 완료 여부를 체크하거나 해제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "변경 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "404", description = "혜택을 찾을 수 없음")
    })
    @PostMapping("/{benefitId}/check")
    public ResponseEntity<BenefitDTO> toggleCheck(
            @PathVariable Long benefitId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(benefitService.toggleBenefitCheck(user.getId(), benefitId));
    }
}
