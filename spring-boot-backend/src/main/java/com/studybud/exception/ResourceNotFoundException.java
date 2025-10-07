package com.studybud.exception;

import com.studybud.util.Constants;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format(Constants.FORMAT_RESOURCE_NOT_FOUND, resourceName, fieldName, fieldValue));
    }
}

