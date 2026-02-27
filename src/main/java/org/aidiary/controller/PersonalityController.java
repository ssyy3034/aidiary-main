package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import org.aidiary.service.PersonalityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/personality")
@RequiredArgsConstructor
public class PersonalityController {

    private final PersonalityService personalityService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = personalityService.chat(body);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/synthesize")
    public ResponseEntity<Map<String, Object>> synthesize(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = personalityService.synthesize(body);
        return ResponseEntity.ok(result);
    }
}
