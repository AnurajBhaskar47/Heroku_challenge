package com.studybud.model;

import com.studybud.util.Constants;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

/**
 * Course entity representing a course that a student is enrolled in
 */
@Entity
@Table(name = Constants.TABLE_COURSES_COURSE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = Constants.COLUMN_USER_ID, nullable = false)
    private User user;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String name;

    @Size(max = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Size(max = 200)
    private String instructor;

    private Integer credits;

    @Size(max = 100)
    private String semester;

    @Column(name = Constants.COLUMN_START_DATE)
    private LocalDate startDate;

    @Column(name = Constants.COLUMN_END_DATE)
    private LocalDate endDate;

    @Min(1)
    @Max(5)
    @Column(name = Constants.COLUMN_DIFFICULTY_LEVEL)
    private Integer difficultyLevel = 3;

    @Column(name = Constants.COLUMN_SYLLABUS_TEXT, columnDefinition = "TEXT")
    private String syllabusText;

    // Class schedule stored as JSON (PostgreSQL jsonb type)
    // Example: {"Monday": {"start_time": "10:00", "end_time": "11:30", "location": "Room 101"}}
    // Optional - can be null or empty object
    @Column(name = Constants.COLUMN_CLASS_SCHEDULE, columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private String classSchedule;

    @Column(name = Constants.COLUMN_IS_ACTIVE, nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // Calculated fields (can be computed from related entities)
    @Transient
    private Double progressPercentage;

    // Helper methods
    public Double getProgressPercentage() {
        // This will be calculated from assignments
        // For now, return 0.0
        return progressPercentage != null ? progressPercentage : 0.0;
    }
}

