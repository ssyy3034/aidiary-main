package org.aidiary.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Diary AI API")
                        .description("Diary AI 프로젝트 API 명세서")
                        .version("v1.0")
                        .contact(new Contact()
                                .name("Diary AI Support")
                                .email("support@aidiary.com")));
    }
}
