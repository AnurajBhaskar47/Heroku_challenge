package com.studybud.service;

import com.studybud.dto.auth.*;
import com.studybud.dto.user.UserProfileResponse;
import com.studybud.exception.BadRequestException;
import com.studybud.model.User;
import com.studybud.repository.UserRepository;
import com.studybud.security.JwtTokenProvider;
import com.studybud.security.UserPrincipal;
import com.studybud.util.Constants;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException(Constants.ERROR_USERNAME_TAKEN);
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(Constants.ERROR_EMAIL_IN_USE);
        }

        // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .timezone(Constants.DEFAULT_TIMEZONE)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Generate tokens
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        // Build response
        UserProfileResponse userProfile = buildUserProfileResponse(user);
        TokenResponse tokens = new TokenResponse(accessToken, refreshToken);

        return AuthResponse.builder()
                .user(userProfile)
                .tokens(tokens)
                .message(Constants.SUCCESS_USER_REGISTERED)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new BadRequestException(Constants.ERROR_USER_NOT_FOUND));

        UserProfileResponse userProfile = buildUserProfileResponse(user);
        TokenResponse tokens = new TokenResponse(accessToken, refreshToken);

        return AuthResponse.builder()
                .user(userProfile)
                .tokens(tokens)
                .build();
    }

    public TokenResponse refreshToken(TokenRefreshRequest request) {
        String refreshToken = request.getRefresh();

        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException(Constants.ERROR_INVALID_REFRESH_TOKEN);
        }

        Long userId = tokenProvider.getUserIdFromToken(refreshToken);
        String newAccessToken = tokenProvider.generateAccessTokenFromUserId(userId);

        return new TokenResponse(newAccessToken, refreshToken);
    }

    private UserProfileResponse buildUserProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .yearOfStudy(user.getYearOfStudy())
                .major(user.getMajor())
                .timezone(user.getTimezone())
                .build();
    }
}

