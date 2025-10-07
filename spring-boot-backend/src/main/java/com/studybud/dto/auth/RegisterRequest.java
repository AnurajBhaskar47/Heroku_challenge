package com.studybud.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 150, message = "Username must be between 3 and 150 characters")
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 254)
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 255, message = "Password must be at least 6 characters")
    private String password;
    
    @Size(max = 150)
    private String firstName;
    
    @Size(max = 150)
    private String lastName;
}

