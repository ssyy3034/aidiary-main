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

            // 순서 상관없는 결합 (간단한 정렬)
            byte[] first = bytes1.length <= bytes2.length ? bytes1 : bytes2;
            byte[] second = bytes1.length > bytes2.length ? bytes1 : bytes2;

            digest.update(first);
            digest.update(second);

            byte[] hash = digest.digest();
            return bytesToHex(hash);
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
