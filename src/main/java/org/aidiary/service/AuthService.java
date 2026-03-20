package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.ChildDTO;
import org.aidiary.dto.request.LoginRequest;
import org.aidiary.dto.request.SignUpRequest;
import org.aidiary.dto.response.AuthResponse;
import org.aidiary.entity.Role;
import org.aidiary.entity.User;
import org.aidiary.exception.DuplicateResourceException;
import org.aidiary.exception.ResourceNotFoundException;
import org.aidiary.repository.UserRepository;
import org.aidiary.security.JwtTokenProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtTokenProvider jwtTokenProvider;

        @Transactional
        public AuthResponse signUp(SignUpRequest request) {
                if (userRepository.existsByUsername(request.getUsername())) {
                        throw new DuplicateResourceException("사용자", "username");
                }

                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new DuplicateResourceException("이메일", "email");
                }

                User user = User.builder()
                                .username(request.getUsername())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .email(request.getEmail())
                                .phone(request.getPhone())
                                .name(request.getName())
                                .role(Role.USER)
                                .build();

                User savedUser = userRepository.save(user);

                // 🔐 로그인과 동일한 방식으로 Authentication 생성
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                                savedUser.getUsername(),
                                null,
                                savedUser.getAuthorities() // UserDetails 구현 필요
                );

                String token = jwtTokenProvider.createToken(authentication, savedUser.getId());

                return AuthResponse.builder()
                                .id(savedUser.getId())
                                .token(token)
                                .username(savedUser.getUsername())
                                .email(savedUser.getEmail())
                                .role(savedUser.getRole().name())
                                .child(savedUser.getChild() != null ? new ChildDTO(savedUser.getChild()) : null)
                                .build();
        }

        @Transactional(readOnly = true)
        public AuthResponse login(LoginRequest request) {
                // 1. 사용자 조회 (보안을 위해 예외 메시지 통일)
                User user = userRepository.findByUsername(request.getUsername())
                                .orElseThrow(() -> {
                                        log.debug("로그인 실패: 사용자 '{}'를 찾을 수 없습니다.", request.getUsername());
                                        return new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
                                });

                // 2. 비밀번호 검증
                if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        log.debug("로그인 실패: 사용자 '{}'의 비밀번호가 일치하지 않습니다.", request.getUsername());
                        throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
                }

                // 3. 토큰 생성 (인증 객체 직접 생성)
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                                user.getUsername(),
                                null,
                                user.getAuthorities());

                String token = jwtTokenProvider.createToken(authentication, user.getId());

                return AuthResponse.builder()
                                .id(user.getId())
                                .token(token)
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .child(user.getChild() != null ? new ChildDTO(user.getChild()) : null)
                                .build();
        }
}
