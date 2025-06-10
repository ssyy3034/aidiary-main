package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.request.LoginRequest;
import org.aidiary.dto.request.SignUpRequest;
import org.aidiary.dto.response.AuthResponse;
import org.aidiary.entity.Role;
import org.aidiary.entity.User;
import org.aidiary.repository.UserRepository;
import org.aidiary.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManagerBean;

    @Transactional
    public AuthResponse signUp(SignUpRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("이미 존재하는 사용자 이름입니다.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .phone(request.getPhone())
                .name(request.getUsername())
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
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManagerBean.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        String token = jwtTokenProvider.createToken(authentication, user.getId());

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
