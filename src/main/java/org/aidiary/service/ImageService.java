package org.aidiary.service;

public interface ImageService {

    void processViaQueue(String jobId, byte[] parent1Bytes, String parent1Name,
            byte[] parent2Bytes, String parent2Name);
}
