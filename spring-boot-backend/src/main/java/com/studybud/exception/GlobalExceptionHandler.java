package com.studybud.exception;

import com.studybud.dto.common.ErrorResponse;
import com.studybud.util.Constants;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                Constants.ERROR_RESOURCE_NOT_FOUND,
                ex.getMessage(),
                request.getDescription(false).replace(Constants.URI_PREFIX, Constants.EMPTY_STRING)
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(
            BadRequestException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                Constants.ERROR_BAD_REQUEST,
                ex.getMessage(),
                request.getDescription(false).replace(Constants.URI_PREFIX, Constants.EMPTY_STRING)
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(
            UnauthorizedException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                Constants.ERROR_UNAUTHORIZED,
                ex.getMessage(),
                request.getDescription(false).replace(Constants.URI_PREFIX, Constants.EMPTY_STRING)
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                Constants.ERROR_AUTHENTICATION_FAILED,
                Constants.ERROR_INVALID_CREDENTIALS,
                request.getDescription(false).replace(Constants.URI_PREFIX, Constants.EMPTY_STRING)
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        Map<String, Object> response = new HashMap<>();
        response.put(Constants.FIELD_TIMESTAMP, LocalDateTime.now());
        response.put(Constants.FIELD_ERROR, Constants.ERROR_VALIDATION);
        response.put(Constants.FIELD_DETAILS, errors);
        response.put(Constants.FIELD_PATH, request.getDescription(false).replace(Constants.URI_PREFIX, Constants.EMPTY_STRING));
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                Constants.ERROR_INTERNAL_SERVER,
                ex.getMessage(),
                request.getDescription(false).replace(Constants.URI_PREFIX, Constants.EMPTY_STRING)
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

