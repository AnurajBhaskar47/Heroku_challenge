package com.studybud.service;

import com.studybud.dto.user.ChangePasswordRequest;
import com.studybud.dto.user.UpdateProfileRequest;
import com.studybud.dto.user.UserProfileResponse;
import com.studybud.exception.BadRequestException;
import com.studybud.exception.ResourceNotFoundException;
import com.studybud.model.User;
import com.studybud.repository.UserRepository;
import com.studybud.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileResponse getCurrentUserProfile(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        return buildUserProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(Authentication authentication, UpdateProfileRequest request) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        // Update fields if provided
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            // Check if email is already taken by another user
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email is already in use");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getYearOfStudy() != null) {
            user.setYearOfStudy(request.getYearOfStudy());
        }
        if (request.getMajor() != null) {
            user.setMajor(request.getMajor());
        }
        if (request.getTimezone() != null) {
            user.setTimezone(request.getTimezone());
        }

        user = userRepository.save(user);
        return buildUserProfileResponse(user);
    }

    @Transactional
    public void changePassword(Authentication authentication, ChangePasswordRequest request) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
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

