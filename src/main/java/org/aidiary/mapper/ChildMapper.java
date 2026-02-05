package org.aidiary.mapper;

import org.aidiary.dto.ChildDTO;
import org.aidiary.entity.Child;
import org.aidiary.entity.User;
import org.springframework.stereotype.Component;

/**
 * Child Entity-DTO 매퍼
 */
@Component
public class ChildMapper {

    /**
     * Entity → DTO 변환
     */
    public ChildDTO toDto(Child entity) {
        if (entity == null) {
            return null;
        }
        return ChildDTO.builder()
                .id(entity.getId())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .parent1Features(entity.getParent1Features())
                .parent2Features(entity.getParent2Features())
                .prompt(entity.getPrompt())
                .gptResponse(entity.getGptResponse())
                .characterImage(entity.getCharacterImage())
                .childName(entity.getChildName())
                .childBirthday(entity.getChildBirthday())
                .build();
    }

    /**
     * DTO 값을 Entity에 적용
     */
    public void updateEntity(Child entity, ChildDTO dto) {
        if (entity == null || dto == null) {
            return;
        }
        entity.setParent1Features(dto.getParent1Features());
        entity.setParent2Features(dto.getParent2Features());
        entity.setPrompt(dto.getPrompt());
        entity.setGptResponse(dto.getGptResponse());
        entity.setCharacterImage(dto.getCharacterImage());
        entity.setChildName(dto.getChildName());
        entity.setChildBirthday(dto.getChildBirthday());
    }

    /**
     * 새 Child 엔티티 생성 (User 연결)
     */
    public Child createEntity(User user) {
        Child child = new Child();
        child.setUser(user);
        return child;
    }
}
