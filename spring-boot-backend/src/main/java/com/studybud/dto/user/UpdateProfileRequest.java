package com.studybud.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    
    @Size(max = 150)
    private String firstName;
    
    @Size(max = 150)
    private String lastName;
    
    @Email(message = "Email should be valid")
    @Size(max = 254)
    private String email;
    
    private Integer yearOfStudy;
    
    @Size(max = 200)
    private String major;
    
    @Size(max = 50)
    private String timezone;
}

