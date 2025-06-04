package org.aidiary.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.UpdatePasswordDTO;
import org.aidiary.dto.UpdateProfileDTO;
import org.aidiary.dto.UserInfoDTO;
import org.aidiary.entity.User;
import org.aidiary.security.JwtTokenProvider;
import org.aidiary.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
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

    @Operation(summary = "사용자 정보 조회", description = "토큰을 이용하여 사용자 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "사용자 정보 조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "유효하지 않은 토큰"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/info")
    public ResponseEntity<?> getUserInfo(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing or invalid Authorization header"));
            }

            String token = authHeader.substring(7);
            String username = jwtTokenProvider.getUsernameFromToken(token); // email → username

            if (username == null || username.isBlank()) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
            }

            User user = userService.findByUsername(username); // email → username
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            UserInfoDTO userInfo = new UserInfoDTO(user);
            return ResponseEntity.ok(userInfo);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid token format"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    @Operation(summary = "비밀번호 변경", description = "사용자의 비밀번호를 변경합니다.")
    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(HttpServletRequest request, @Valid @RequestBody UpdatePasswordDTO updatePasswordDTO) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("유효하지 않은 인증 헤더입니다.");
            }

            String token = authHeader.substring(7);
            String userName = jwtTokenProvider.getAuthentication(token).getName();

            User user = userService.findByUsername(userName);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("사용자를 찾을 수 없습니다.");
            }

            if (!passwordEncoder.matches(updatePasswordDTO.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("기존 비밀번호가 일치하지 않습니다.");
            }

            userService.updatePassword(user, updatePasswordDTO.getNewPassword());
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류: " + e.getMessage());
        }
    }

    @Operation(summary = "사용자 삭제", description = "사용자 계정을 삭제합니다.")
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(400).body("유효하지 않은 인증 헤더입니다.");
            }
            String token = authHeader.substring(7);
            String email = jwtTokenProvider.getAuthentication(token).getName();

            userService.deleteUser(email);
            return ResponseEntity.ok("사용자 계정이 성공적으로 삭제되었습니다.");
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(404).body("사용자를 찾을 수 없습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("서버 오류: " + e.getMessage());
        }
    }

    @Operation(summary = "사용자 프로필 수정", description = "이메일, 전화번호, 자녀 정보 등 사용자 프로필을 수정합니다.")
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(HttpServletRequest request, @RequestBody UpdateProfileDTO dto) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body("유효하지 않은 인증 헤더입니다.");
            }

            String token = authHeader.substring(7);
            String userName = jwtTokenProvider.getAuthentication(token).getName();

            User user = userService.findByUsername(userName);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("사용자를 찾을 수 없습니다.");
            }

            userService.updateProfile(user, dto);
            return ResponseEntity.ok("프로필이 성공적으로 수정되었습니다.");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류: " + e.getMessage());
        }
    }
}
