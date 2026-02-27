package org.aidiary.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "health_metric")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthMetric extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate recordDate;

    private Double weight;      // 체중(kg)
    private Integer systolic;   // 수축기 혈압
    private Integer diastolic;  // 이완기 혈압
}
