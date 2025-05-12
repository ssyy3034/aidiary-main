package org.aidiary;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")  // 테스트 프로파일 사용
@SpringBootTest
class AidiaryApplicationTests {

    @Test
    void contextLoads() {
        System.out.println("Application context loaded successfully.");
    }

}
