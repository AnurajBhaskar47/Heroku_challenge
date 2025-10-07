package com.studybud.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private DashboardStats stats;
    private List<Map<String, Object>> upcomingAssignments;
    private List<Map<String, Object>> upcomingExams;
    private List<Map<String, Object>> upcomingStudyPlanDeadlines;
    private List<Map<String, Object>> recentCourses;
}

