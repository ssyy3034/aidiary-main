import React from "react";
import { Paper, PaperProps } from "@mui/material";

interface GlassCardProps extends PaperProps {
  subColor?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  subColor = "#c2675a",
  sx,
  ...props
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 800,
        width: "100%",
        p: 4,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.4)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${subColor}`,
        boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};

export default GlassCard;
