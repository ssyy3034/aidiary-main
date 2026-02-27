package org.aidiary.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fetal_movement")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FetalMovement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime movementTime;

    @Column(nullable = false)
    private int intensity; // 1=약, 2=보통, 3=강

    @Column(length = 500)
    private String notes;
}
