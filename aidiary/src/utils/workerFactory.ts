/**
 * 이미지 압축 워커 생성 함수
 * 테스트 환경(Jest)에서 import.meta.url 사용 시 발생하는 구문 오류를 우회하기 위해 분리함.
 */
export const createImageCompressionWorker = (): Worker => {
  return new Worker(
    new URL("../workers/imageCompression.worker.ts", import.meta.url),
  );
};
