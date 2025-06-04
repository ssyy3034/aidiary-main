package org.aidiary.service;

import jakarta.transaction.Transactional;
import org.aidiary.dto.ChildDTO;
import org.aidiary.dto.UpdateProfileDTO;
import org.aidiary.entity.Child;
import org.aidiary.entity.User;
import org.aidiary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger; // 추가
import org.slf4j.LoggerFactory; // 추가

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);


    @Transactional
    public void updateProfile(User user, UpdateProfileDTO dto) {
        user.setPhone(dto.getPhone());

        if (dto.getChild() != null) {
            ChildDTO childDto = dto.getChild();
            List<Child> children = user.getChildren();

            if (children != null && !children.isEmpty()) {
                // 기존 자녀 수정
                Child child = children.get(0);
                updateChildFromDto(child, childDto);
            } else {
                // 새로운 자녀 추가
                Child newChild = new Child();
                updateChildFromDto(newChild, childDto);
                newChild.setUser(user);
                user.getChildren().add(newChild);
            }
        }

        userRepository.save(user);
    }

    private void updateChildFromDto(Child child, ChildDTO dto) {
        child.setParent1Features(dto.getParent1Features());
        child.setParent2Features(dto.getParent2Features());
        child.setPrompt(dto.getPrompt());
        child.setGptResponse(dto.getGptResponse());
        child.setCharacterImage(dto.getCharacterImage());
    }



    public User findByUsername(String userName) {
        logger.info("이메일로 사용자 찾기: {}", userName); // 로그 추가
        try {
            User user = userRepository.findByUsername(userName).orElse(null);
            if(user != null) {
                logger.info("이메일로 사용자 찾기 성공: {}", userName);
                return user;
            } else {
                logger.warn("이메일로 사용자 찾기 실패: {}", userName);
                return null;
            }

        } catch (Exception e) {
            logger.error("이메일로 사용자 찾기 중 오류 발생: {}", e.getMessage()); // 로그 추가
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
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));
        userRepository.delete(user);
    }
}
