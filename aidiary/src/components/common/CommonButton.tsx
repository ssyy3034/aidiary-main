import React from "react";
import { Button, ButtonProps, CircularProgress } from "@mui/material";

interface CommonButtonProps extends ButtonProps {
  loading?: boolean;
  subColor?: string;
}

const CommonButton: React.FC<CommonButtonProps> = ({
  children,
  loading = false,
  subColor = "#c2675a",
  sx,
  disabled,
  ...props
}) => {
  return (
    <Button
      variant="contained"
      disabled={disabled || loading}
      sx={{
        borderRadius: "16px",
        px: 4,
        py: 1.5,
        backgroundColor: subColor,
        color: "white",
        fontWeight: "bold",
        "&:hover": { backgroundColor: "#b7554d" },
        ...sx,
      }}
      {...props}
    >
      {loading ? (
        <>
          <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default CommonButton;
