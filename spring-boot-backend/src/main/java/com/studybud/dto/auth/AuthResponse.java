package com.studybud.dto.auth;

import com.studybud.dto.user.UserProfileResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private UserProfileResponse user;
    private TokenResponse tokens;
    private String message;
}

