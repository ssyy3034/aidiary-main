package org.aidiary.controller;

import io.swagger.v3.oas.annotations.Operation;
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

    @Operation(summary = "사용자 정보 조회")
    @GetMapping("/info")
    public ResponseEntity<UserInfoDTO> getUserInfo(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(new UserInfoDTO(user));
    }

    @Operation(summary = "비밀번호 변경")
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

    @Operation(summary = "사용자 삭제")
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteUser(@AuthenticationPrincipal User user) {
        userService.deleteUserById(user.getId());
        return ResponseEntity.ok("사용자 계정이 성공적으로 삭제되었습니다.");
    }

    @Operation(summary = "사용자 프로필 수정")
    @PatchMapping("/profile")
    public ResponseEntity<String> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileDTO dto) {
        userService.updateProfile(user.getUsername(), dto);
        return ResponseEntity.ok("프로필이 성공적으로 수정되었습니다.");
    }
}
