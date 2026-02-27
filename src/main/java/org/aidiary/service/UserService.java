package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.ChildUpdateDTO;
import org.aidiary.dto.UpdateProfileDTO;
import org.aidiary.entity.Child;
import org.aidiary.entity.User;
import org.aidiary.exception.ResourceNotFoundException;
import org.aidiary.repository.ChildRepository;
import org.aidiary.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final ChildRepository childRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void updateProfile(String username, UpdateProfileDTO dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }

        ChildUpdateDTO childDto = dto.getChild();
        if (childDto != null) {
            Optional<Child> existingChild = childRepository.findByUser_Id(user.getId());
            Child child = existingChild.orElse(new Child());

            if (childDto.getChildName() != null)
                child.setChildName(childDto.getChildName());
            if (childDto.getChildBirthday() != null)
                child.setChildBirthday(childDto.getChildBirthday());
            if (childDto.getGptResponse() != null)
                child.setGptResponse(childDto.getGptResponse());

            child.setUser(user);
            childRepository.save(child);
        }

        userRepository.save(user);
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
