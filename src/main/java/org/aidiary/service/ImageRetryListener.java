package org.aidiary.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.config.RabbitMQConfig;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * 이미지 처리 중 발생하는 시스템 장애를 위한 자동 재시도 리스너.
 * 지수적 백오프(Exponential Backoff)를 사용하여 큐의 부하를 분산하고 복구 가능성을 높인다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ImageRetryListener {

    private final RabbitTemplate rabbitTemplate;

    private static final int MAX_RETRY_COUNT = 5;
    private static final String X_RETRY_COUNT = "x-retry-count";

    @RabbitListener(queues = RabbitMQConfig.IMAGE_DLQ)
    public void onDeadLetter(Message message) {
        MessageProperties props = message.getMessageProperties();
        int retryCount = getRetryCount(props);

        if (retryCount < MAX_RETRY_COUNT) {
            scheduleRetry(message, retryCount + 1);
        } else {
            log.error("❌ [Retry Exhausted] 최대 재시도({})를 초과하여 작업을 최종 실패 처리합니다.", MAX_RETRY_COUNT);
            // 필요 시 관리자 알림 송신 로직 추가 가능
        }
    }

    private int getRetryCount(MessageProperties props) {
        return Optional.ofNullable(props.getHeader(X_RETRY_COUNT))
                .filter(Integer.class::isInstance)
                .map(Integer.class::cast)
                .orElse(0);
    }

    private void scheduleRetry(Message message, int nextRetry) {
        long delay = calculateExponentialBackoff(nextRetry);
        
        // 메시지 헤더 업데이트 및 만료 시간(TTL) 설정
        message.getMessageProperties().setHeader(X_RETRY_COUNT, nextRetry);
        message.getMessageProperties().setExpiration(String.valueOf(delay));

        log.warn("🔄 [Retry {}/{}] 시스템 장애 감지. {}ms 후 재시도 합니다.", nextRetry, MAX_RETRY_COUNT, delay);

        // 지연용 대기 큐(Wait Queue)로 전송
        rabbitTemplate.send(RabbitMQConfig.IMAGE_WAIT_QUEUE, message);
    }

    private long calculateExponentialBackoff(int retry) {
        // 1회: 5s, 2회: 10s, 3회: 20s, 4회: 40s, 5회: 80s
        return (long) Math.pow(2, retry - 1) * 5000;
    }
}
