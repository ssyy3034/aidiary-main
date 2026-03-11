package org.aidiary.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.request.FetalMovementRequest;
import org.aidiary.dto.response.FetalMovementDTO;
import org.aidiary.dto.response.FetalMovementSummaryDTO;
import org.aidiary.entity.User;
import org.aidiary.service.FetalMovementService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/fetal-movement")
@RequiredArgsConstructor
@Tag(name = "Fetal Movement API", description = "태동 측정 및 기록 관리 API")
public class FetalMovementController {

    private final FetalMovementService fetalMovementService;

    @Operation(summary = "태동 기록", description = "새로운 태동 강도와 메모를 기록합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "기록 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @PostMapping
    public ResponseEntity<FetalMovementDTO> log(
            @Valid @RequestBody FetalMovementRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(fetalMovementService.log(user.getId(), request));
    }

    @Operation(summary = "오늘의 태동 요약", description = "오늘 하루 동안 기록된 태동 횟수와 마지막 태동 시간을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping("/today")
    public ResponseEntity<FetalMovementSummaryDTO> getTodaySummary(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(fetalMovementService.getTodaySummary(user.getId()));
    }

    @Operation(summary = "태동 기록 히스토리 조회", description = "특정 날짜의 태동 기록 목록을 페이지네이션하여 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping("/history")
    public ResponseEntity<Page<FetalMovementDTO>> getHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(fetalMovementService.getHistory(user.getId(), queryDate, page, size));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        fetalMovementService.delete(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
