package org.aidiary.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * RabbitMQ 메시지 페이로드.
 * parent 이미지는 byte[]로 직렬화하여 전송.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageJobMessage implements Serializable {
    private String jobId;
    private byte[] parent1Bytes;
    private String parent1Name;
    private byte[] parent2Bytes;
    private String parent2Name;
}
