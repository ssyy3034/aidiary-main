package org.aidiary.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
@Slf4j
public class SystemController {

    private final DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        
        try (Connection connection = dataSource.getConnection()) {
            status.put("database", "CONNECTED");
            status.put("database_metadata", connection.getMetaData().getURL());
        } catch (Exception e) {
            status.put("database", "DISCONNECTED");
            status.put("database_error", e.getMessage());
            log.error("Health check database connection failed", e);
        }

        return ResponseEntity.ok(status);
    }
}
