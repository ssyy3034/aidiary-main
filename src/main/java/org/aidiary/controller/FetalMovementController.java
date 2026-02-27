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

@RestController
@RequestMapping("/api/fetal-movement")
@RequiredArgsConstructor
public class FetalMovementController {

    private final FetalMovementService fetalMovementService;

    @PostMapping
    public ResponseEntity<FetalMovementDTO> log(
            @Valid @RequestBody FetalMovementRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(fetalMovementService.log(user.getId(), request));
    }

    @GetMapping("/today")
    public ResponseEntity<FetalMovementSummaryDTO> getTodaySummary(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(fetalMovementService.getTodaySummary(user.getId()));
    }

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
