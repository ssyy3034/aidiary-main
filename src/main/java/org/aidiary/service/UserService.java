package org.aidiary.service;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.aidiary.dto.ChildUpdateDTO;
import org.aidiary.dto.UpdateProfileDTO;
import org.aidiary.entity.Child;
import org.aidiary.entity.User;
import org.aidiary.exception.ResourceNotFoundException;
import org.aidiary.repository.ChildRepository;
import org.aidiary.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ChildRepository childRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Transactional
    public void updateProfile(String username, UpdateProfileDTO dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        // ✨ 선택적 phone 업데이트
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }

        // ✨ 자녀 정보가 있을 경우
        ChildUpdateDTO childDto = dto.getChild();
        if (childDto != null) {
            Optional<Child> existingChild = childRepository.findByUser_Id(user.getId());
            Child child = existingChild.orElse(new Child());

            // 부분 업데이트
            if (childDto.getChildName() != null)
                child.setChildName(childDto.getChildName());
            if (childDto.getChildBirthday() != null)
                child.setChildBirthday(childDto.getChildBirthday());
            if (childDto.getGptResponse() != null)
                child.setGptResponse(childDto.getGptResponse());

            // 새로 만든 경우를 대비해 user 설정
            child.setUser(user);
            childRepository.save(child);
        }

        userRepository.save(user); // 변경사항 저장
    }

    @Transactional(readOnly = true)
    public User findByUsername(String userName) {
        logger.info("사용자명으로 사용자 찾기: {}", userName);
        try {
            User user = userRepository.findByUsername(userName).orElse(null);
            if (user != null) {
                logger.info("사용자명으로 사용자 찾기 성공: {}", userName);
                return user;
            } else {
                logger.warn("사용자명으로 사용자 찾기 실패: {}", userName);
                return null;
            }
        } catch (Exception e) {
            logger.error("사용자명으로 사용자 찾기 중 오류 발생: {}", e.getMessage());
            return null;
        }
    }

    @Transactional
    public void updatePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        userRepository.delete(user);
    }

    @Transactional
    public void deleteUserById(Long id) {
        userRepository.deleteById(id);
    }
}
