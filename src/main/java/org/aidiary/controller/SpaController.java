package org.aidiary.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA(Single Page Application) 라우팅 지원 컨트롤러.
 * React Router가 처리하는 클라이언트 측 경로를 index.html로 포워딩합니다.
 *
 * API 경로(/api/**)나 정적 리소스(확장자가 있는 파일)는 이 핸들러에 매칭되지 않습니다.
 */
@Controller
public class SpaController {

    /**
     * 확장자가 없는 모든 경로를 index.html로 포워딩.
     * Spring의 정적 리소스 핸들러가 먼저 매칭을 시도하므로,
     * .js, .css, .png 등의 정적 파일은 이 핸들러에 도달하지 않습니다.
     */
    @GetMapping(value = {
            "/login",
            "/register",
            "/diary",
            "/profile",
            "/character",
            "/character-personality"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
