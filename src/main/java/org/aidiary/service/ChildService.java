package org.aidiary.service;

import lombok.RequiredArgsConstructor;
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
public class ChildService {

    private final ChildRepository childRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChildDTO saveChildData(ChildDTO childDto) {
        if (childDto == null || childDto.getUserId() == null) {
            throw new IllegalArgumentException("Child DTO or userId cannot be null");
        }

        User user = userRepository.findById(childDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + childDto.getUserId()));

        Child child = new Child();
        child.setUser(user);
        child.setParent1Features(childDto.getParent1Features());
        child.setParent2Features(childDto.getParent2Features());
        child.setPrompt(childDto.getPrompt());
        child.setGptResponse(childDto.getGptResponse());
        child.setCharacterImage(childDto.getCharacterImage());

        Child saved = childRepository.save(child);
        return convertToDto(saved);
    }


    public Optional<ChildDTO> getChildByUserId(Long id) {
        return childRepository.findById(id)
                .map(this::convertToDto);
    }

    private Child convertToEntity(ChildDTO dto) {
        Child child = new Child();
        child.setId(dto.getId());  // User의 id를 그대로 사용
        child.setParent1Features(dto.getParent1Features());
        child.setParent2Features(dto.getParent2Features());
        child.setPrompt(dto.getPrompt());
        child.setGptResponse(dto.getGptResponse());
        child.setCharacterImage(dto.getCharacterImage());
        return child;
    }

    private ChildDTO convertToDto(Child entity) {
        return ChildDTO.builder()
                .id(entity.getId()) // 자녀 ID
                .userId(entity.getUser().getId()) // 부모 ID
                .parent1Features(entity.getParent1Features())
                .parent2Features(entity.getParent2Features())
                .prompt(entity.getPrompt())
                .gptResponse(entity.getGptResponse())
                .characterImage(entity.getCharacterImage())
                .build();
    }

}