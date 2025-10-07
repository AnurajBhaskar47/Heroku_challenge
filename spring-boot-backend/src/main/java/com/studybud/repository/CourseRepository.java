package com.studybud.repository;

import com.studybud.model.Course;
import com.studybud.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    List<Course> findByUserOrderByCreatedAtDesc(User user);
    
    List<Course> findByUserAndIsActive(User user, Boolean isActive);
    
    Optional<Course> findByIdAndUser(Long id, User user);
    
    long countByUser(User user);
    
    long countByUserAndIsActive(User user, Boolean isActive);
    
    // Get top N recent courses
    List<Course> findTop5ByUserOrderByCreatedAtDesc(User user);
}

