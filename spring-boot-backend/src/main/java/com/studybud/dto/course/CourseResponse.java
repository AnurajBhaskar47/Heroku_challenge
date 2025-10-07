package com.studybud.dto.course;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private String instructor;
    private Integer credits;
    private String semester;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer difficultyLevel;
    private String classSchedule;
    private Boolean isActive;
    private Double progressPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

