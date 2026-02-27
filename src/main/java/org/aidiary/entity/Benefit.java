package org.aidiary.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "benefits")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Benefit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer recommendedWeekStart;

    private Integer recommendedWeekEnd;

    @Column(length = 50)
    private String rewardAmount;
}
