package com.studybud.service;

import com.studybud.dto.course.CourseRequest;
import com.studybud.dto.course.CourseResponse;
import com.studybud.exception.ResourceNotFoundException;
import com.studybud.model.Course;
import com.studybud.model.User;
import com.studybud.repository.CourseRepository;
import com.studybud.repository.UserRepository;
import com.studybud.security.UserPrincipal;
import com.studybud.util.Constants;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public List<CourseResponse> getAllCourses(Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<Course> courses = courseRepository.findByUserOrderByCreatedAtDesc(user);
        return courses.stream()
                .map(this::mapToCourseResponse)
                .collect(Collectors.toList());
    }

    public CourseResponse getCourseById(Long id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = courseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.RESOURCE_COURSE, Constants.FIELD_ID, id));
        return mapToCourseResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);

        Course course = Course.builder()
                .user(user)
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .instructor(request.getInstructor())
                .credits(request.getCredits())
                .semester(request.getSemester())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .difficultyLevel(request.getDifficultyLevel() != null ? request.getDifficultyLevel() : 3)
                .syllabusText(request.getSyllabusText())
                .classSchedule(request.getClassSchedule())
                .isActive(true)
                .build();

        course = courseRepository.save(course);
        return mapToCourseResponse(course);
    }

    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = courseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.RESOURCE_COURSE, Constants.FIELD_ID, id));

        // Update fields
        course.setName(request.getName());
        course.setCode(request.getCode());
        course.setDescription(request.getDescription());
        course.setInstructor(request.getInstructor());
        course.setCredits(request.getCredits());
        course.setSemester(request.getSemester());
        course.setStartDate(request.getStartDate());
        course.setEndDate(request.getEndDate());
        course.setDifficultyLevel(request.getDifficultyLevel());
        course.setSyllabusText(request.getSyllabusText());
        if (request.getClassSchedule() != null) {
            course.setClassSchedule(request.getClassSchedule());
        }

        course = courseRepository.save(course);
        return mapToCourseResponse(course);
    }

    @Transactional
    public void deleteCourse(Long id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = courseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException(Constants.RESOURCE_COURSE, Constants.FIELD_ID, id));
        courseRepository.delete(course);
    }

    private User getCurrentUser(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException(Constants.RESOURCE_USER, Constants.FIELD_ID, userPrincipal.getId()));
    }

    private CourseResponse mapToCourseResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .code(course.getCode())
                .description(course.getDescription())
                .instructor(course.getInstructor())
                .credits(course.getCredits())
                .semester(course.getSemester())
                .startDate(course.getStartDate())
                .endDate(course.getEndDate())
                .difficultyLevel(course.getDifficultyLevel())
                .classSchedule(course.getClassSchedule())
                .isActive(course.getIsActive())
                .progressPercentage(course.getProgressPercentage())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}

