package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import org.aidiary.dto.ChildDto;
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
    public ChildDto saveChildData(ChildDto childDto) {
        if (childDto == null || childDto.getId() == null) {
            throw new IllegalArgumentException("Child DTO or ID cannot be null");
        }

        Child child = convertToEntity(childDto);
        User user = userRepository.findById(childDto.getId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + childDto.getId()));

        child.setId(childDto.getId());
        child.setUser(user);
        Child savedChild = childRepository.save(child);
        return convertToDto(savedChild);
    }

    public Optional<ChildDto> getChildByUserId(Long id) {
        return childRepository.findById(id)
                .map(this::convertToDto);
    }

    private Child convertToEntity(ChildDto dto) {
        Child child = new Child();
        child.setId(dto.getId());  // User의 id를 그대로 사용
        child.setParent1Features(dto.getParent1Features());
        child.setParent2Features(dto.getParent2Features());
        child.setPrompt(dto.getPrompt());
        child.setGptResponse(dto.getGptResponse());
        child.setCharacterImage(dto.getCharacterImage());
        return child;
    }

    private ChildDto convertToDto(Child entity) {
        return ChildDto.builder()
                .id(entity.getId())
                .parent1Features(entity.getParent1Features())
                .parent2Features(entity.getParent2Features())
                .prompt(entity.getPrompt())
                .gptResponse(entity.getGptResponse())
                .characterImage(entity.getCharacterImage())
                .build();
    }
}