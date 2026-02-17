import { renderHook, act } from "@testing-library/react";
import useCharacter from "./useCharacter"; // 실제 훅 경로

// Mock Worker
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;

  postMessage(data: any) {
    // Simulate async work
    setTimeout(() => {
      if (data.file.name === "error.png") {
        // Error case
        if (this.onerror) {
          // Standard ErrorEvent structure
          // @ts-ignore
          this.onerror(
            new ErrorEvent("error", { message: "Compression Failed" }),
          );
        } else if (this.onmessage) {
          // Fallback custom error message logic from our worker
          this.onmessage({
            data: { success: false, error: "Compression Failed" },
          } as MessageEvent);
        }
      } else {
        // Success case
        if (this.onmessage) {
          this.onmessage({
            data: {
              success: true,
              blob: new Blob(["compressed"], { type: "image/jpeg" }),
            },
          } as MessageEvent);
        }
      }
    }, 50);
  }

  terminate() {}
}

// Global Mock
(global as any).Worker = MockWorker;
(global as any).URL.createObjectURL = jest.fn(() => "mock-url");

// Mock dependencies
jest.mock("../api/client", () => ({
  childApi: {},
  chatApi: {},
}));

jest.mock("axios", () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
}));

// Mock workerFactory to avoid import.meta issue
jest.mock("../utils/workerFactory", () => ({
  createImageCompressionWorker: () => new MockWorker(),
}));

describe("useCharacter - Worker Integration", () => {
  it("should handle worker error gracefully", async () => {
    // Setup
    const { result } = renderHook(() => useCharacter(jest.fn()));

    // Set required fields to bypass validation
    act(() => {
      result.current.setChildName("Test Child");
      result.current.setChildBirthday("2024-01-01");
    });

    const errorFile = new File([""], "error.png", { type: "image/png" });
    const normalFile = new File([""], "normal.png", { type: "image/png" });

    // Act
    await act(async () => {
      try {
        await result.current.generateCharacter(errorFile, normalFile, "shy");
      } catch (e) {
        // Did not expect error to be thrown, prompt should be handled inside hook
      }
    });

    // Assert
    // Our generateCharacter catches error and sets status, returns null
    expect(result.current.status).toBe("서버 연결 실패"); // In catch block of generateCharacter
  });
});
