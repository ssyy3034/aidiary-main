package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.request.HealthMetricRequest;
import org.aidiary.dto.response.HealthMetricDTO;
import org.aidiary.entity.User;
import org.aidiary.service.HealthMetricService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@Tag(name = "Health Metric API", description = "임산부 건강 지표(체중, 혈압 등) 관리 API")
public class HealthMetricController {

    private final HealthMetricService healthMetricService;

    @Operation(summary = "건강 지표 저장", description = "사용자의 건강 지표(체중, 혈압 등)를 저장합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "건강 지표 저장 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    @PostMapping
    public ResponseEntity<HealthMetricDTO> save(
            @RequestBody HealthMetricRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(healthMetricService.save(user.getId(), request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<HealthMetricDTO>> getHistory(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(healthMetricService.getHistory(user.getId()));
    }

    @GetMapping("/latest")
    public ResponseEntity<HealthMetricDTO> getLatest(
            @AuthenticationPrincipal User user) {
        return healthMetricService.getLatest(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
