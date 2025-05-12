package org.aidiary.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "child")
public class Child {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String parent1Features;

    @Column(columnDefinition = "TEXT")
    private String parent2Features;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Column(columnDefinition = "TEXT")
    private String gptResponse;

    // Getters and Setters
}
