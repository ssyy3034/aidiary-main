package org.aidiary.controller;

import lombok.extern.slf4j.Slf4j;
import org.aidiary.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/images")
@Slf4j
public class ImageController {

    @Autowired
    private ImageService imageService;

    @PostMapping("/analyze")
    public ResponseEntity<byte[]> analyzeImages(
            @RequestParam("parent1") MultipartFile parent1,
            @RequestParam("parent2") MultipartFile parent2) {
        try {
            byte[] imageBytes = imageService.sendImages(parent1, parent2);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(imageBytes);
        } catch (IOException e) {
            log.error("Image analysis failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
