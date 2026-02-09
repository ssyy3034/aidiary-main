/* eslint-disable no-restricted-globals */

// Worker 메시지 타입 정의
type WorkerMessage = {
  file: File;
  quality: number;
  maxWidth: number;
};

type WorkerResponse = {
  success: boolean;
  blob?: Blob;
  error?: string;
};

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { file, quality, maxWidth } = e.data;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = maxWidth / bitmap.width;
    const width = maxWidth;
    const height = bitmap.height * scale;

    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas Context 생성 실패");
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    // Blob으로 변환
    const blob = await offscreen.convertToBlob({
      type: "image/jpeg",
      quality: quality,
    });

    self.postMessage({ success: true, blob } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : "Unknown Error",
    } as WorkerResponse);
  }
};

export {};
