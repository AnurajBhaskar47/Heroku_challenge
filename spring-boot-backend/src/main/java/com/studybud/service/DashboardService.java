package com.studybud.service;

import com.studybud.dto.dashboard.DashboardResponse;
import com.studybud.dto.dashboard.DashboardStats;
import com.studybud.exception.ResourceNotFoundException;
import com.studybud.model.Assignment;
import com.studybud.model.Course;
import com.studybud.model.User;
import com.studybud.repository.AssignmentRepository;
import com.studybud.repository.CourseRepository;
import com.studybud.repository.UserRepository;
import com.studybud.security.UserPrincipal;
import com.studybud.util.Constants;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;

    public DashboardResponse getDashboardData(Authentication authentication) {
        User user = getCurrentUser(authentication);

        // Calculate stats
        DashboardStats stats = calculateStats(user);

        // Get recent courses (top 5 most recently created)
        List<Map<String, Object>> recentCourses = courseRepository.findTop5ByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapCourseToMap)
                .collect(Collectors.toList());

        // Get upcoming assignments (limit to 10)
        List<Map<String, Object>> upcomingAssignments = assignmentRepository
                .findUpcomingAssignments(user, LocalDateTime.now())
                .stream()
                .limit(10)
                .map(this::mapAssignmentToMap)
                .collect(Collectors.toList());

        // Get upcoming items (empty for now until exams/study plans are implemented)
        List<Map<String, Object>> upcomingExams = new ArrayList<>();
        List<Map<String, Object>> upcomingStudyPlanDeadlines = new ArrayList<>();

        return DashboardResponse.builder()
                .stats(stats)
                .upcomingAssignments(upcomingAssignments)
                .upcomingExams(upcomingExams)
                .upcomingStudyPlanDeadlines(upcomingStudyPlanDeadlines)
                .recentCourses(recentCourses)
                .build();
    }

    private DashboardStats calculateStats(User user) {
        long totalCourses = courseRepository.countByUser(user);
        long activeCourses = courseRepository.countByUserAndIsActive(user, true);

        // Assignment statistics
        long totalAssignments = assignmentRepository.countByUser(user);
        long pendingAssignments = assignmentRepository.countPendingByUser(user);
        long completedAssignments = assignmentRepository.countCompletedByUser(user);
        
        // These will be populated when study plans are implemented
        long totalStudyPlans = 0;
        long activeStudyPlans = 0;
        int studyStreakDays = 0;

        return DashboardStats.builder()
                .totalCourses(totalCourses)
                .activeCourses(activeCourses)
                .totalAssignments(totalAssignments)
                .pendingAssignments(pendingAssignments)
                .completedAssignments(completedAssignments)
                .totalStudyPlans(totalStudyPlans)
                .activeStudyPlans(activeStudyPlans)
                .studyStreakDays(studyStreakDays)
                .build();
    }

    private User getCurrentUser(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException(Constants.RESOURCE_USER, Constants.FIELD_ID, userPrincipal.getId()));
    }

    private Map<String, Object> mapCourseToMap(Course course) {
        Map<String, Object> map = new HashMap<>();
        map.put(Constants.FIELD_ID, course.getId());
        map.put(Constants.FIELD_NAME, course.getName());
        map.put(Constants.FIELD_CODE, course.getCode());
        map.put(Constants.FIELD_DESCRIPTION, course.getDescription());
        map.put(Constants.FIELD_INSTRUCTOR, course.getInstructor());
        map.put(Constants.FIELD_CREDITS, course.getCredits());
        map.put(Constants.FIELD_SEMESTER, course.getSemester());
        map.put(Constants.FIELD_START_DATE, course.getStartDate());
        map.put(Constants.FIELD_END_DATE, course.getEndDate());
        map.put(Constants.FIELD_DIFFICULTY_LEVEL, course.getDifficultyLevel());
        map.put(Constants.FIELD_IS_ACTIVE, course.getIsActive());
        map.put(Constants.FIELD_PROGRESS_PERCENTAGE, course.getProgressPercentage());
        map.put(Constants.FIELD_CREATED_AT, course.getCreatedAt());
        map.put(Constants.FIELD_UPDATED_AT, course.getUpdatedAt());
        return map;
    }

    private Map<String, Object> mapAssignmentToMap(Assignment assignment) {
        Map<String, Object> map = new HashMap<>();
        map.put(Constants.FIELD_ID, assignment.getId());
        map.put(Constants.FIELD_COURSE_ID, assignment.getCourse().getId());
        map.put(Constants.FIELD_COURSE_NAME, assignment.getCourse().getName());
        map.put(Constants.FIELD_TITLE, assignment.getTitle());
        map.put(Constants.FIELD_ASSIGNMENT_TYPE, assignment.getAssignmentType());
        map.put(Constants.FIELD_DESCRIPTION, assignment.getDescription());
        map.put(Constants.FIELD_DUE_DATE, assignment.getDueDate());
        map.put(Constants.FIELD_ESTIMATED_HOURS, assignment.getEstimatedHours());
        map.put(Constants.FIELD_WEIGHT, assignment.getWeight());
        map.put(Constants.FIELD_GRADE, assignment.getGrade());
        map.put(Constants.FIELD_STATUS, assignment.getStatus());
        map.put("isOverdue", assignment.isOverdue());
        map.put("daysUntilDue", assignment.getDaysUntilDue());
        return map;
    }
}

