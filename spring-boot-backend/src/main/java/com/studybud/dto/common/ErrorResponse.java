package com.studybud.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime timestamp;
    private String error;
    private String details;
    private String path;
    
    public ErrorResponse(String error, String details) {
        this.timestamp = LocalDateTime.now();
        this.error = error;
        this.details = details;
    }
}

