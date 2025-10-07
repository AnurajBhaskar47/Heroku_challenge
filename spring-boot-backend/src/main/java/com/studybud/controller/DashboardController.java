package com.studybud.controller;

import com.studybud.dto.dashboard.DashboardResponse;
import com.studybud.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Dashboard", description = "Dashboard data APIs")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Get dashboard data", description = "Retrieve all dashboard data for authenticated user")
    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(Authentication authentication) {
        DashboardResponse dashboard = dashboardService.getDashboardData(authentication);
        return ResponseEntity.ok(dashboard);
    }
}

