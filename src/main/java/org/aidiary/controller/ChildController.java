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

@RestController
@RequestMapping("/api/child")
@RequiredArgsConstructor
@Slf4j
public class ChildController {

    private final ChildService childService;

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

    @GetMapping("/me")
    public ResponseEntity<ChildDTO> getMyChild(@AuthenticationPrincipal User user) {
        return childService.getChildByUserId(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
