package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.ChildDTO;
import org.aidiary.service.ChildService;
import org.aidiary.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/child")
@RequiredArgsConstructor
public class ChildController {

    private final ChildService childService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/save")
    public ResponseEntity<ChildDTO> saveChild(
            @RequestBody ChildDTO childDto,
            @RequestHeader(value = "Authorization", required = true) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String jwtToken = token.substring(7); // "Bearer " 이후의 토큰값

            // 토큰 유효성 검사
            if (!jwtTokenProvider.validateToken(jwtToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Long id = jwtTokenProvider.getUserIdFromToken(jwtToken);
            if (id == null) {
                return ResponseEntity.badRequest()
                        .body(null);
            }

            childDto.setId(id);
            ChildDTO savedChild = childService.saveChildData(childDto);
            return ResponseEntity.ok(savedChild);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChildDTO> getChildById(@PathVariable Long id) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        return childService.getChildByUserId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}