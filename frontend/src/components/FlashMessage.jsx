
import { useEffect, useState } from "react";
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiX } from "react-icons/fi";

function getType(type, message) {
  if (type) return type;

  const text = String(message || "").toLowerCase();

  if (/\b(success|successfully|saved|published|updated|deleted|created)\b/.test(text)) {
    return "success";
  }

  if (/\b(error|failed|failure|unable|invalid|denied|expired)\b/.test(text)) {
    return "error";
  }

  return "info";
}

export default function FlashMessage({
  message,
  type,
  duration = 10000,
  onClose,
}) {
  const [visible, setVisible] = useState(Boolean(message));
  const resolvedType = getType(type, message);

  useEffect(() => {
    setVisible(Boolean(message));

    if (!message) return undefined;

    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!visible || !message) return null;

  const Icon =
    resolvedType === "success"
      ? FiCheckCircle
      : resolvedType === "error"
        ? FiAlertTriangle
        : FiInfo;

  return (
    <div
      className={`inkwell-flash inkwell-flash--${resolvedType}`}
      role={resolvedType === "error" ? "alert" : "status"}
    >
      <Icon className="inkwell-flash__icon" size={22} />

      <div className="inkwell-flash__body">
        <strong>
          {resolvedType === "success"
            ? "Success"
            : resolvedType === "error"
              ? "Something went wrong"
              : "Notice"}
        </strong>
        <p>{message}</p>
      </div>

      <button
        type="button"
        className="inkwell-flash__close"
        aria-label="Dismiss message"
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
      >
        <FiX size={19} />
      </button>
    </div>
  );
}
