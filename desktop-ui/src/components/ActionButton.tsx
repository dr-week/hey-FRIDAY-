import React from "react";

interface ActionButtonProps {
  readonly title: string;
  readonly className?: string;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  className = "",
  onClick,
  children,
}) => {
  return (
    <button
      type="button"
      className={`action-btn ${className}`}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
