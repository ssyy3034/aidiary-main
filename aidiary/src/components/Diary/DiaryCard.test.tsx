import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DiaryCard from "./DiaryCard";
import type { DiaryEntry } from "../../types";

// framer-motion mock
jest.mock("framer-motion", () => ({
  motion: {
    article: ({ children, layout, ...props }: any) => (
      <article {...props}>{children}</article>
    ),
    div: ({ children, layout, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const baseDiaryEntry: DiaryEntry = {
  id: 1,
  title: "테스트 일기",
  content: "오늘 딸기를 먹어서 행복했어요",
  emotion: "happy",
  createdAt: "2026-02-18T10:00:00",
};

describe("DiaryCard", () => {
  const defaultProps = {
    entry: baseDiaryEntry,
    isLoadingAI: false,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onRequestAI: jest.fn(),
    onGetDrawing: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("일기 내용을 렌더링한다", () => {
    render(<DiaryCard {...defaultProps} />);
    expect(screen.getByTestId("diary-content")).toHaveTextContent(
      "오늘 딸기를 먹어서 행복했어요",
    );
  });

  it("감정 뱃지를 표시한다", () => {
    render(<DiaryCard {...defaultProps} />);
    expect(screen.getByTestId("emotion-badge")).toHaveTextContent("행복");
  });

  it("날짜를 올바른 형식으로 표시한다", () => {
    render(<DiaryCard {...defaultProps} />);
    expect(screen.getByTestId("diary-date")).toBeInTheDocument();
  });

  it("AI 분석 버튼을 클릭하면 onRequestAI가 호출된다", () => {
    render(<DiaryCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("ai-button"));
    expect(defaultProps.onRequestAI).toHaveBeenCalledTimes(1);
  });

  it("AI 로딩 중에는 버튼이 비활성화된다", () => {
    render(<DiaryCard {...defaultProps} isLoadingAI={true} />);
    expect(screen.getByTestId("ai-button")).toBeDisabled();
  });

  it("AI 응답이 있으면 표시한다", () => {
    const entryWithAI: DiaryEntry = {
      ...baseDiaryEntry,
      aiResponse: "엄마가 딸기 먹으니까 나도 달콤해!",
    };
    render(<DiaryCard {...defaultProps} entry={entryWithAI} />);
    expect(screen.getByTestId("ai-response")).toHaveTextContent(
      "엄마가 딸기 먹으니까 나도 달콤해!",
    );
  });

  it("fetalArtUrl이 있으면 이미지를 렌더링한다", () => {
    const entryWithArt: DiaryEntry = {
      ...baseDiaryEntry,
      fetalArtUrl: "/images/test-art.png",
    };
    render(<DiaryCard {...defaultProps} entry={entryWithArt} />);
    expect(screen.getByTestId("fetal-art-image")).toHaveAttribute(
      "src",
      "/images/test-art.png",
    );
  });

  it("fetalArtUrl이 없으면 이미지를 렌더링하지 않는다", () => {
    render(<DiaryCard {...defaultProps} />);
    expect(screen.queryByTestId("fetal-art-image")).not.toBeInTheDocument();
  });
});
