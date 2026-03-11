package org.aidiary.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.UpdatePasswordDTO;
import org.aidiary.dto.UpdateProfileDTO;
import org.aidiary.dto.UserInfoDTO;
import org.aidiary.entity.User;
import org.aidiary.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User API", description = "사용자 정보 관리 API")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Operation(summary = "사용자 정보 조회", description = "현재 로그인한 사용자의 프로필 및 아이 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping("/info")
    public ResponseEntity<UserInfoDTO> getUserInfo(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(new UserInfoDTO(user));
    }

    @Operation(summary = "비밀번호 변경", description = "기존 비밀번호를 확인한 후 새로운 비밀번호로 변경합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "변경 성공"),
            @ApiResponse(responseCode = "401", description = "기존 비밀번호 불일치 혹은 인증 실패")
    })
    @PutMapping("/update-password")
    public ResponseEntity<String> updatePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdatePasswordDTO updatePasswordDTO) {

        if (!passwordEncoder.matches(updatePasswordDTO.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("기존 비밀번호가 일치하지 않습니다.");
        }

        userService.updatePassword(user, updatePasswordDTO.getNewPassword());
        return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
    }

    @Operation(summary = "사용자 삭제", description = "계정을 영구 삭제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteUser(@AuthenticationPrincipal User user) {
        userService.deleteUserById(user.getId());
        return ResponseEntity.ok("사용자 계정이 성공적으로 삭제되었습니다.");
    }

    @Operation(summary = "사용자 프로필 수정", description = "전화번호나 아이 정보를 수정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @PatchMapping("/profile")
    public ResponseEntity<String> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileDTO dto) {
        userService.updateProfile(user.getUsername(), dto);
        return ResponseEntity.ok("프로필이 성공적으로 수정되었습니다.");
    }
}
