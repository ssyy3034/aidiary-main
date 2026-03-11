package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.ChildDTO;
import org.aidiary.entity.User;
import org.aidiary.service.ChildService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/child")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Child API", description = "아이(캐릭터) 관리 API")
public class ChildController {

    private final ChildService childService;

    @Operation(summary = "아이 정보 저장/수정", description = "부모의 특징 및 아이의 기본 정보를 저장하거나 수정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "저장 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PostMapping("/save")
    public ResponseEntity<ChildDTO> saveChild(
            @RequestBody ChildDTO childDto,
            @AuthenticationPrincipal User user) {

        childDto.setUserId(user.getId());
        log.debug("💾 저장 요청 받은 ChildDTO: {}", childDto);

        ChildDTO savedChild = childService.saveChildData(childDto);

        log.debug("✅ 저장된 Child: {}", savedChild);
        return ResponseEntity.ok(savedChild);
    }

    @Operation(summary = "내 아이 정보 조회", description = "로그인한 사용자의 아이 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "404", description = "아이 정보 없음")
    })
    @GetMapping("/me")
    public ResponseEntity<ChildDTO> getMyChild(@AuthenticationPrincipal User user) {
        return childService.getChildByUserId(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
