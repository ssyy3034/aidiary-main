package org.aidiary.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aidiary.config.RabbitMQConfig;
import org.aidiary.dto.ImageJobMessage;
import org.aidiary.service.ImageService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueueImageService implements ImageService {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitAdmin rabbitAdmin;

    @Override
    public void processViaQueue(String jobId, byte[] parent1Bytes, String parent1Name,
            byte[] parent2Bytes, String parent2Name) {

        java.util.Properties queueProperties = rabbitAdmin.getQueueProperties(RabbitMQConfig.IMAGE_QUEUE);
        if (queueProperties != null) {
            Object msgCountObj = queueProperties.get(RabbitAdmin.QUEUE_MESSAGE_COUNT);
            if (msgCountObj instanceof Integer && (Integer) msgCountObj >= 100) {
                log.warn("큐 포화 ({}건), 요청 거절", msgCountObj);
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "현재 이용자가 많아 사진 합성이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
            }
        }

        ImageJobMessage message = new ImageJobMessage(
                jobId, parent1Bytes, parent1Name, parent2Bytes, parent2Name);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.IMAGE_EXCHANGE,
                RabbitMQConfig.IMAGE_ROUTING_KEY,
                message);
        log.info("Image job {} queued", jobId);
    }
}
