package org.aidiary.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.UpdatePasswordDTO;
import org.aidiary.dto.UpdateProfileDTO;
import org.aidiary.dto.UserInfoDTO;
import org.aidiary.entity.User;
import org.aidiary.security.JwtTokenProvider;
import org.aidiary.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User API", description = "사용자 정보 관리 API")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "사용자 정보 조회")
    @GetMapping("/info")
    public ResponseEntity<?> getUserInfo(HttpServletRequest request) {
        try {
            String token = extractToken(request);
            String username = jwtTokenProvider.getUsernameFromToken(token);

            if (username == null || username.isBlank()) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
            }

            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            return ResponseEntity.ok(new UserInfoDTO(user));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "비밀번호 변경")
    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(HttpServletRequest request, @Valid @RequestBody UpdatePasswordDTO updatePasswordDTO) {
        try {
            String token = extractToken(request);
            String username = jwtTokenProvider.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(404).body("사용자를 찾을 수 없습니다.");
            }

            if (!passwordEncoder.matches(updatePasswordDTO.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.status(401).body("기존 비밀번호가 일치하지 않습니다.");
            }

            userService.updatePassword(user, updatePasswordDTO.getNewPassword());
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("서버 오류: " + e.getMessage());
        }
    }

    @Operation(summary = "사용자 삭제")
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(HttpServletRequest request) {
        try {
            String token = extractToken(request);
            String username = jwtTokenProvider.getUsernameFromToken(token);

            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(404).body("사용자를 찾을 수 없습니다.");
            }

            userService.deleteUserById(user.getId());
            return ResponseEntity.ok("사용자 계정이 성공적으로 삭제되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("서버 오류: " + e.getMessage());
        }
    }

    @Operation(summary = "사용자 프로필 수정")
    @PatchMapping("/profile")
    public ResponseEntity<?> updateProfile(HttpServletRequest request, @RequestBody UpdateProfileDTO dto) {
        try {
            String token = extractToken(request);
            userService.updateProfile(token, dto); // 토큰만 넘겨주면 내부에서 username 꺼내서 처리
            return ResponseEntity.ok("프로필이 성공적으로 수정되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("서버 오류: " + e.getMessage());
        }
    }

    // ✅ 공통 토큰 추출 메서드
    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 인증 헤더입니다.");
        }
        return authHeader.substring(7);
    }
}