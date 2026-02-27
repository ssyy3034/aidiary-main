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

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthMetricController {

    private final HealthMetricService healthMetricService;

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
