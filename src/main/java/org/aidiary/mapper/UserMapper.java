package org.aidiary.mapper;

import org.aidiary.dto.UserInfoDTO;
import org.aidiary.dto.request.SignUpRequest;
import org.aidiary.entity.Role;
import org.aidiary.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * User Entity-DTO 매퍼
 */
@Component
public class UserMapper {

    /**
     * Entity → UserInfoDTO 변환
     */
    public UserInfoDTO toInfoDto(User entity) {
        if (entity == null) {
            return null;
        }
        return new UserInfoDTO(entity);
    }

    /**
     * SignUpRequest → Entity 변환
     */
    public User toEntity(SignUpRequest request, PasswordEncoder passwordEncoder) {
        if (request == null) {
            return null;
        }
        return User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .phone(request.getPhone())
                .name(request.getUsername())
                .role(Role.USER)
                .build();
    }
}
