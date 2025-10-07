package com.studybud;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main application class for Study Bud
 * 
 * A comprehensive student study management system with features for:
 * - Course management
 * - Assignment tracking
 * - Study plan generation
 * - Progress monitoring
 * - AI-powered assistance (RAG pipeline)
 */
@SpringBootApplication
@EnableJpaAuditing
public class StudyBudApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudyBudApplication.class, args);
        System.out.println("\n" +
            "╔════════════════════════════════════════════════════╗\n" +
            "║                                                    ║\n" +
            "║           Study Bud API is Running!                ║\n" +
            "║                                                    ║\n" +
            "║  Swagger UI: http://localhost:8080/swagger-ui.html║\n" +
            "║  Health Check: http://localhost:8080/health       ║\n" +
            "║  H2 Console: http://localhost:8080/h2-console     ║\n" +
            "║                                                    ║\n" +
            "╚════════════════════════════════════════════════════╝\n"
        );
    }
}

