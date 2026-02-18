package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.ChildDTO;
import org.aidiary.security.JwtTokenProvider;
import org.aidiary.service.ChildService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/child")
@RequiredArgsConstructor
@Slf4j
public class ChildController {

    private final ChildService childService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/save")
    public ResponseEntity<?> saveChild(
            @RequestBody ChildDTO childDto,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            if (userId == null) {
                log.warn("잘못된 토큰입니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("유효하지 않은 토큰입니다.");
            }

            childDto.setUserId(userId); // ✅ 올바르게 설정

            log.debug("💾 저장 요청 받은 ChildDTO: {}", childDto);

            ChildDTO savedChild = childService.saveChildData(childDto);

            log.debug("✅ 저장된 Child: {}", savedChild);

            return ResponseEntity.ok(savedChild);
        } catch (Exception e) {
            log.error("🚨 Child 저장 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("서버 오류: " + e.getMessage());
        }
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ChildDTO> getChildById(@PathVariable Long id) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        return childService.getChildByUserId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<ChildDTO> getMyChild(@RequestHeader("Authorization") String token) {
        Long userId = extractUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return childService.getChildByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private Long extractUserIdFromToken(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            log.warn("Authorization 헤더 형식 오류");
            return null;
        }

        String jwt = token.substring(7);
        if (!jwtTokenProvider.validateToken(jwt)) {
            log.warn("토큰 유효성 검사 실패");
            return null;
        }

        return jwtTokenProvider.getUserIdFromToken(jwt);
    }
}
