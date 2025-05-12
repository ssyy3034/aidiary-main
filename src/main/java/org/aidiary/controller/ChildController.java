package org.aidiary.controller;

import org.aidiary.dto.ChildDto;
import org.aidiary.service.ChildService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/child")
public class ChildController {

    private final ChildService childService;

    @Autowired
    public ChildController(ChildService childService) {
        this.childService = childService;
    }

    @PostMapping("/save")
    public ResponseEntity<String> saveChildData(@RequestBody ChildDto childDto) {
        childService.saveChildData(childDto);
        return ResponseEntity.ok("Child data saved successfully.");
    }
}
