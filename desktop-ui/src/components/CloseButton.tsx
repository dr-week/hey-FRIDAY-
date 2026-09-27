import React from "react";
import { X } from "lucide-react";

interface CloseButtonProps {
  readonly onClick: () => void;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      className="action-btn close-btn"
      title="Exit"
      onClick={onClick}
    >
      <X size={18} />
    </button>
  );
};
