package com.studybud.dto.course;

import com.studybud.util.Constants;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CourseRequest {
    
    @NotBlank(message = Constants.ERROR_COURSE_NAME_REQUIRED)
    @Size(max = 255)
    private String name;
    
    @Size(max = 50)
    private String code;
    
    private String description;
    
    @Size(max = 200)
    private String instructor;
    
    private Integer credits;
    
    @Size(max = 100)
    private String semester;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    @Min(1)
    @Max(5)
    private Integer difficultyLevel = 3;
    
    private String syllabusText;
    
    // Class schedule as JSON string
    // Example: {"Monday": {"start_time": "10:00", "end_time": "11:30", "location": "Room 101"}}
    private String classSchedule;
}

