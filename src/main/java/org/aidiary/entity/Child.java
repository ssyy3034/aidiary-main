package org.aidiary.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "child")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "user")
public class Child {
    @Id
    @Column(name = "user_id") // user_id가 실제 컬럼명임을 명시
    private Long id;

    @Column(name = "parent1_features")
    private String parent1Features;

    @Column(name = "parent2_features")
    private String parent2Features;

    private String prompt;

    @Column(name = "gpt_response", columnDefinition = "LONGTEXT")
    private String gptResponse;

    @Column(name = "child_image", columnDefinition = "LONGTEXT")
    private String characterImage;

    @Column(name = "child_name")
    private String childName;

    @Column(name = "child_birthday")
    private String childBirthday;

    @Column(name = "child_personality")
    private String childPersonality;

    @OneToOne
    @MapsId // ← 핵심: Child.id = User.id
    @JoinColumn(name = "user_id")
    private User user;
}
