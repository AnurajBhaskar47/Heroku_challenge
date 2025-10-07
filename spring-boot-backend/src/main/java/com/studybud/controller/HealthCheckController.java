package com.studybud.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "Health Check", description = "Application health check APIs")
@RestController
public class HealthCheckController {

    @Operation(summary = "Health check", description = "Check if the API is running")
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("message", "Study Bud API is running");
        return ResponseEntity.ok(response);
    }
}

