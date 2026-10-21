interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warning?: string;
  showCancel?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  warning,
  showCancel = true,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 ix-backdrop ix-backdrop-blur"
      style={{ background: "hsl(220 30% 4% / 0.85)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg p-6 flex flex-col gap-5 ix-modal-enter"
        style={{
          background: "linear-gradient(135deg, hsl(220 28% 10%) 0%, hsl(220 28% 13%) 100%)",
          border: "1px solid hsl(0 80% 50% / 0.5)",
          boxShadow: "0 0 40px hsl(0 80% 50% / 0.15), inset 0 1px 0 hsl(0 80% 50% / 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "1.4em" }}>⚠️</span>
          <h2
            className="font-orbitron font-bold text-base tracking-[0.2em] uppercase"
            style={{ color: "hsl(0 80% 65%)" }}
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <p
          className="font-orbitron text-sm tracking-[0.05em] leading-relaxed"
          style={{ color: "hsl(210 30% 70%)" }}
        >
          {message}
        </p>

        {/* Host warning */}
        {warning && (
          <p
            className="font-orbitron text-xs tracking-[0.05em] leading-relaxed px-3 py-2 rounded"
            style={{
              color: "hsl(50 100% 70%)",
              background: "hsl(50 80% 15% / 0.6)",
              border: "1px solid hsl(50 100% 40% / 0.4)",
            }}
          >
            {warning}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {showCancel && (
            <button
              onClick={onCancel}
              className="ix-btn flex-1 py-2.5 rounded font-orbitron text-xs tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer"
              style={{
                background: "hsl(220 28% 15%)",
                border: "1px solid hsl(210 30% 30%)",
                color: "hsl(210 30% 65%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "hsl(220 28% 20%)";
                e.currentTarget.style.borderColor = "hsl(210 30% 45%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "hsl(220 28% 15%)";
                e.currentTarget.style.borderColor = "hsl(210 30% 30%)";
              }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="ix-btn flex-1 py-2.5 rounded font-orbitron text-xs tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer"
            style={{
              background: "hsl(0 70% 20%)",
              border: "1px solid hsl(0 80% 45%)",
              color: "hsl(0 80% 70%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(0 75% 25%)";
              e.currentTarget.style.boxShadow = "0 0 15px hsl(0 80% 50% / 0.4), inset 0 0 10px hsl(0 80% 50% / 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(0 70% 20%)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
