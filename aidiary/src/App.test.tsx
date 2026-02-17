import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

// Mock axios to prevent ESM issues
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
jest.mock("./utils/workerFactory", () => ({
  createImageCompressionWorker: () => ({
    postMessage: jest.fn(),
    terminate: jest.fn(),
    onmessage: null,
  }),
}));

test("renders app title", () => {
  render(<App />);
  const titleElement = screen.getByText(/AI 산모 일기/i);
  expect(titleElement).toBeInTheDocument();
});
