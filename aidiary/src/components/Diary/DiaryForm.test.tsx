import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DiaryForm from "./DiaryForm";

// framer-motion mock
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("DiaryForm", () => {
  const defaultProps = {
    dailyPrompt: "",
    isLoading: false,
    onSubmit: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("텍스트 입력 영역을 렌더링한다", () => {
    render(<DiaryForm {...defaultProps} />);
    expect(screen.getByTestId("diary-textarea")).toBeInTheDocument();
  });

  it("제출 버튼을 렌더링한다", () => {
    render(<DiaryForm {...defaultProps} />);
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("빈 텍스트에서는 제출 버튼이 비활성화된다", () => {
    render(<DiaryForm {...defaultProps} />);
    expect(screen.getByTestId("submit-button")).toBeDisabled();
  });

  it("텍스트 입력 시 글자 수 카운터가 업데이트된다", () => {
    render(<DiaryForm {...defaultProps} />);
    fireEvent.change(screen.getByTestId("diary-textarea"), {
      target: { value: "테스트" },
    });
    expect(screen.getByTestId("char-counter")).toHaveTextContent("3/500");
  });

  it("텍스트 입력 후 제출 버튼이 활성화된다", () => {
    render(<DiaryForm {...defaultProps} />);
    fireEvent.change(screen.getByTestId("diary-textarea"), {
      target: { value: "오늘의 일기" },
    });
    expect(screen.getByTestId("submit-button")).not.toBeDisabled();
  });

  it("제출 시 onSubmit이 호출된다", async () => {
    render(<DiaryForm {...defaultProps} />);
    fireEvent.change(screen.getByTestId("diary-textarea"), {
      target: { value: "오늘의 일기" },
    });
    fireEvent.submit(screen.getByTestId("diary-submit-form"));
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith("오늘의 일기");
    });
  });

  it("오늘의 질문이 있으면 표시한다", () => {
    render(
      <DiaryForm
        {...defaultProps}
        dailyPrompt="오늘 아기에게 하고 싶은 말은?"
      />,
    );
    expect(screen.getByTestId("daily-prompt")).toHaveTextContent(
      "오늘 아기에게 하고 싶은 말은?",
    );
  });

  it("오늘의 질문 클릭 시 텍스트에 추가된다", () => {
    render(
      <DiaryForm
        {...defaultProps}
        dailyPrompt="오늘 아기에게 하고 싶은 말은?"
      />,
    );
    fireEvent.click(screen.getByTestId("daily-prompt"));
    expect(screen.getByTestId("diary-textarea")).toHaveValue(
      "오늘 아기에게 하고 싶은 말은?\n",
    );
  });

  it("로딩 중에는 입력이 비활성화된다", () => {
    render(<DiaryForm {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId("diary-textarea")).toBeDisabled();
  });

  it("500자를 초과하는 입력은 잘린다", () => {
    render(<DiaryForm {...defaultProps} />);
    const longText = "A".repeat(600);
    fireEvent.change(screen.getByTestId("diary-textarea"), {
      target: { value: longText },
    });
    expect(screen.getByTestId("char-counter")).toHaveTextContent("500/500");
  });
});
