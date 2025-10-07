package com.studybud.controller;

import com.studybud.dto.course.CourseRequest;
import com.studybud.dto.course.CourseResponse;
import com.studybud.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Courses", description = "Course management APIs")
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class CourseController {

    private final CourseService courseService;

    @Operation(summary = "Get all courses", description = "Retrieve all courses for authenticated user")
    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAllCourses(Authentication authentication) {
        List<CourseResponse> courses = courseService.getAllCourses(authentication);
        return ResponseEntity.ok(courses);
    }

    @Operation(summary = "Get course by ID", description = "Retrieve a specific course by ID")
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourseById(
            @PathVariable Long id,
            Authentication authentication) {
        CourseResponse course = courseService.getCourseById(id, authentication);
        return ResponseEntity.ok(course);
    }

    @Operation(summary = "Create new course", description = "Create a new course")
    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            Authentication authentication) {
        CourseResponse course = courseService.createCourse(request, authentication);
        return new ResponseEntity<>(course, HttpStatus.CREATED);
    }

    @Operation(summary = "Update course", description = "Update an existing course")
    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request,
            Authentication authentication) {
        CourseResponse course = courseService.updateCourse(id, request, authentication);
        return ResponseEntity.ok(course);
    }

    @Operation(summary = "Delete course", description = "Delete a course")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable Long id,
            Authentication authentication) {
        courseService.deleteCourse(id, authentication);
        return ResponseEntity.noContent().build();
    }
}

