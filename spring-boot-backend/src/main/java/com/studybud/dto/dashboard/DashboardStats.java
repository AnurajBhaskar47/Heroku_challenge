package com.studybud.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalCourses;
    private long activeCourses;
    private long totalAssignments;
    private long pendingAssignments;
    private long completedAssignments;
    private long totalStudyPlans;
    private long activeStudyPlans;
    private int studyStreakDays;
}

