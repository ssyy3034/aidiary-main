package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.response.PregnancyWeekDTO;
import org.aidiary.entity.User;
import org.aidiary.service.PregnancyWeekCacheService;
import org.aidiary.service.PregnancyWeekService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pregnancy")
@RequiredArgsConstructor
public class PregnancyWeekController {

    private final PregnancyWeekService pregnancyWeekService;
    private final PregnancyWeekCacheService pregnancyWeekCacheService;

    @GetMapping("/current")
    public ResponseEntity<PregnancyWeekDTO> getCurrentWeek(
            @AuthenticationPrincipal User user) {
        return pregnancyWeekService.getCurrentWeekData(user.getId())
                .map(baseDto -> pregnancyWeekCacheService.getWeekContent(baseDto.getWeek()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{week}")
    public ResponseEntity<PregnancyWeekDTO> getWeek(@PathVariable int week) {
        return ResponseEntity.ok(pregnancyWeekCacheService.getWeekContent(week));
    }
}
