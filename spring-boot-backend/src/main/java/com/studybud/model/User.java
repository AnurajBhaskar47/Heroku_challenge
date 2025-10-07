package com.studybud.model;

import com.studybud.util.Constants;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * User entity representing a student in the system
 */
@Entity
@Table(name = Constants.TABLE_ACCOUNTS_USER, uniqueConstraints = {
    @UniqueConstraint(columnNames = Constants.FIELD_USERNAME),
    @UniqueConstraint(columnNames = Constants.FIELD_EMAIL)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, unique = true)
    private String username;

    @NotBlank
    @Email
    @Size(max = 254)
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String password;

    @Size(max = 150)
    @Column(name = Constants.COLUMN_FIRST_NAME)
    private String firstName;

    @Size(max = 150)
    @Column(name = Constants.COLUMN_LAST_NAME)
    private String lastName;

    @Column(name = Constants.COLUMN_YEAR_OF_STUDY)
    private Integer yearOfStudy;

    @Size(max = 200)
    private String major;

    @Size(max = 50)
    @Column(nullable = false)
    @Builder.Default
    private String timezone = Constants.DEFAULT_TIMEZONE;

    // Django AbstractUser fields
    @Column(name = Constants.COLUMN_IS_ACTIVE, nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = Constants.COLUMN_IS_STAFF, nullable = false)
    @Builder.Default
    private Boolean isStaff = false;

    @Column(name = Constants.COLUMN_IS_SUPERUSER, nullable = false)
    @Builder.Default
    private Boolean isSuperuser = false;

    @Column(name = Constants.COLUMN_LAST_LOGIN)
    private java.time.LocalDateTime lastLogin;

    @Column(name = Constants.COLUMN_DATE_JOINED, nullable = false)
    @Builder.Default
    private java.time.LocalDateTime dateJoined = java.time.LocalDateTime.now();

    // Study preferences stored as JSON (PostgreSQL jsonb type)
    @Column(name = Constants.COLUMN_STUDY_PREFERENCES)
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String studyPreferences = "{}";

    // Helper methods
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return username;
    }
}

