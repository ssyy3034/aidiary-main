package org.aidiary.service;

import jakarta.transaction.Transactional;
import org.aidiary.dto.UserDTO;
import org.aidiary.entity.User;
import org.aidiary.util.JwtUtil;
import org.aidiary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger; // 추가
import org.slf4j.LoggerFactory; // 추가

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil; // JwtUtil 인스턴스 주입
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Transactional
    public User register(UserDTO userDTO) {
        logger.info("회원가입 시도: {}", userDTO.getEmail()); // 로그 추가

        if (userRepository.existsByEmail(userDTO.getEmail())) {
            logger.warn("이미 사용 중인 이메일: {}", userDTO.getEmail()); // 로그 추가
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        String encodedPassword = passwordEncoder.encode(userDTO.getPassword());
        User user = User.builder()
                .email(userDTO.getEmail())
                .password(encodedPassword)
                .name(userDTO.getName())
                .build();
        try {
            User savedUser = userRepository.save(user);
            logger.info("회원가입 성공: {}", savedUser.getEmail()); // 로그 추가
            return savedUser;
        } catch (DataIntegrityViolationException e) {
            logger.error("데이터베이스 오류: {}", e.getMessage()); // 로그 추가
            throw new RuntimeException("데이터베이스 오류가 발생했습니다.", e);
        } catch (Exception e) {
            logger.error("회원가입 중 오류 발생: {}", e.getMessage()); // 로그 추가
            throw new RuntimeException("회원가입 중 오류가 발생했습니다.", e);
        }
    }

    public User authenticate(String email, String password) {
        logger.info("로그인 시도: {}", email); // 로그 추가
        try {
            User user = userRepository.findByEmail(email)
                    .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                    .orElse(null);

            if (user != null) {
                logger.info("로그인 성공: {}", email); // 로그 추가
                return user;
            } else {
                logger.warn("로그인 실패: 잘못된 이메일 또는 비밀번호"); // 로그 추가
                return null;
            }
        } catch (Exception e) {
            logger.error("로그인 중 오류 발생: {}", e.getMessage()); // 로그 추가
            return null;
        }
    }

    public User findByEmail(String email) {
        logger.info("이메일로 사용자 찾기: {}", email); // 로그 추가
        try {
            User user = userRepository.findByEmail(email).orElse(null);
            if(user != null) {
                logger.info("이메일로 사용자 찾기 성공: {}", email);
                return user;
            } else {
                logger.warn("이메일로 사용자 찾기 실패: {}", email);
                return null;
            }

        } catch (Exception e) {
            logger.error("이메일로 사용자 찾기 중 오류 발생: {}", e.getMessage()); // 로그 추가
            return null;
        }
    }
    public User findByEmailFromToken(String token) {
        try {
            // JwtUtil 인스턴스를 사용하여 extractEmail 호출
            String email = jwtUtil.extractEmail(token);

            if (email == null) {
                throw new IllegalArgumentException("Invalid token");
            }

            return findByEmail(email);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to extract email from token: " + e.getMessage(), e);
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
