package org.aidiary.service;

import org.aidiary.dto.ChildDto;
import org.aidiary.entity.Child;
import org.aidiary.repository.ChildRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChildService {

    private final ChildRepository childRepository;

    @Autowired
    public ChildService(ChildRepository childRepository) {
        this.childRepository = childRepository;
    }

    public void saveChildData(ChildDto childDto) {
        Child child = new Child();
        child.setParent1Features(childDto.getParent1Features());
        child.setParent2Features(childDto.getParent2Features());
        child.setPrompt(childDto.getPrompt());
        child.setGptResponse(childDto.getGptResponse());
        childRepository.save(child);
    }
}
