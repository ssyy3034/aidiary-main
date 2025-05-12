package org.aidiary.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    private final String uploadDir = "/uploads/";

    public String getUploadDir() {
        return uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /uploads/**로 접근 시 실제 파일 경로를 매핑
        registry.addResourceHandler(uploadDir + "**")
                .addResourceLocations("file:" + uploadDir);
    }
}
