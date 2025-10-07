package com.studybud.controller;

import com.studybud.dto.common.ApiResponse;
import com.studybud.dto.user.ChangePasswordRequest;
import com.studybud.dto.user.UpdateProfileRequest;
import com.studybud.dto.user.UserProfileResponse;
import com.studybud.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User Profile", description = "User profile management APIs")
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get current user profile", description = "Retrieve authenticated user's profile information")
    @GetMapping
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile(Authentication authentication) {
        UserProfileResponse response = userService.getCurrentUserProfile(authentication);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update user profile", description = "Update authenticated user's profile information")
    @PatchMapping
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        UserProfileResponse response = userService.updateProfile(authentication, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Change password", description = "Change authenticated user's password")
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        userService.changePassword(authentication, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}

