package org.aidiary.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class ContentHashUtil {

    /**
     * 두 이미지 파일의 바이트 배열을 기반으로 고유한 SHA-256 해시를 생성합니다.
     * 순서에 무관하게 동일한 해시를 보장하기 위해 크기 비교 후 정렬하여 결합합니다.
     */
    public static String calculateHash(byte[] bytes1, byte[] bytes2) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            // 각 이미지를 독립적으로 해시한 뒤 문자열 정렬로 순서를 고정
            // → parent1/parent2 순서가 바뀌어도 동일한 결합 해시 생성
            String hash1 = bytesToHex(digest.digest(bytes1));
            digest.reset();
            String hash2 = bytesToHex(digest.digest(bytes2));

            String combined = hash1.compareTo(hash2) <= 0
                    ? hash1 + hash2
                    : hash2 + hash1;

            digest.reset();
            return bytesToHex(digest.digest(combined.getBytes()));
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
