package org.aidiary.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "child")
@Getter
@Setter
@NoArgsConstructor
public class Child {
    @Id
    private Long id;

    @Column(name = "parent1_features")
    private String parent1Features;

    @Column(name = "parent2_features")
    private String parent2Features;

    private String prompt;

    @Column(name = "gpt_response")
    private String gptResponse;

    @Column(name = "character_image")
    private String characterImage;

    @Column(name = "child_name")
    private String childName;

    @Column(name = "child_birthday")
    private String childBirthday;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}