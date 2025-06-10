package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.dto.ChildDTO;
import org.aidiary.entity.Child;
import org.aidiary.entity.User;
import org.aidiary.repository.ChildRepository;
import org.aidiary.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChildService {

    private final ChildRepository childRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChildDTO saveChildData(ChildDTO childDto) {
        validateInput(childDto);

        log.debug("📥 [ChildService] 받은 ChildDTO: {}", childDto);

        User user = userRepository.findById(childDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + childDto.getUserId()));
        log.debug("✅ [ChildService] User 조회 성공: {}", user.getUsername());

        Child child = childRepository.findById(user.getId())
                .orElseGet(() -> createNewChild(user));

        updateChildFields(child, childDto);

        Child saved = childRepository.save(child);
        log.debug("💾 [ChildService] Child 저장 또는 수정 완료");

        return convertToDto(saved);
    }

    public Optional<ChildDTO> getChildByUserId(Long id) {
        return childRepository.findById(id)
                .map(this::convertToDto);
    }

    private void validateInput(ChildDTO dto) {
        if (dto == null || dto.getUserId() == null) {
            throw new IllegalArgumentException("Child DTO 또는 userId가 null입니다.");
        }
        if (dto.getCharacterImage() == null || dto.getCharacterImage().isEmpty()) {
            throw new IllegalArgumentException("characterImage는 필수입니다.");
        }
    }

    private Child createNewChild(User user) {
        Child child = new Child();
        child.setUser(user); // @MapsId를 위한 설정
        return child;
    }

    private void updateChildFields(Child child, ChildDTO dto) {
        child.setParent1Features(dto.getParent1Features());
        child.setParent2Features(dto.getParent2Features());
        child.setPrompt(dto.getPrompt());
        child.setGptResponse(dto.getGptResponse());
        child.setCharacterImage(dto.getCharacterImage());
        child.setChildName(dto.getChildName());
        child.setChildBirthday(dto.getChildBirthday());
    }

    private ChildDTO convertToDto(Child entity) {
        return ChildDTO.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .parent1Features(entity.getParent1Features())
                .parent2Features(entity.getParent2Features())
                .prompt(entity.getPrompt())
                .gptResponse(entity.getGptResponse())
                .characterImage(entity.getCharacterImage())
                .childName(entity.getChildName())
                .childBirthday(entity.getChildBirthday())
                .build();
    }
}
