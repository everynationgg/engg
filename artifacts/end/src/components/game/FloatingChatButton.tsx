interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  typingActive?: boolean;
  isOpen?: boolean;
}

export default function FloatingChatButton({
  onClick,
  unreadCount = 0,
  typingActive = false,
  isOpen = false,
}: FloatingChatButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close chat" : "Open chat"}
      title={isOpen ? "Close chat (Esc)" : "Open chat (Enter)"}
      className="fixed z-20 flex items-center justify-center transition-all duration-200 ix-btn"
      style={{
        left: 0,
        top: typeof window !== 'undefined' && window.innerWidth < 640 ? "70%" : "50%",
        transform: "translateY(-50%)",
        width: "28px",
        height: "64px",
        borderRadius: "0 10px 10px 0",
        background: isOpen
          ? "hsl(185 80% 18% / 0.85)"
          : unreadCount > 0
            ? "hsl(0 60% 22% / 0.75)"
            : "hsl(220 25% 12% / 0.55)",
        borderRight: `1px solid ${unreadCount > 0 ? "hsl(0 85% 55% / 0.6)" : "hsl(185 100% 50% / 0.25)"}`,
        borderTop: `1px solid ${unreadCount > 0 ? "hsl(0 85% 55% / 0.6)" : "hsl(185 100% 50% / 0.25)"}`,
        borderBottom: `1px solid ${unreadCount > 0 ? "hsl(0 85% 55% / 0.6)" : "hsl(185 100% 50% / 0.25)"}`,
        borderLeft: "none",
        color: "hsl(190 80% 78%)",
        boxShadow: unreadCount > 0
          ? "0 0 14px hsl(0 85% 55% / 0.3)"
          : "2px 0 12px hsl(185 100% 50% / 0.1)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.width = "32px";
        e.currentTarget.style.background = isOpen
          ? "hsl(185 80% 22% / 0.9)"
          : "hsl(220 25% 16% / 0.75)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.width = "28px";
        e.currentTarget.style.background = isOpen
          ? "hsl(185 80% 18% / 0.85)"
          : unreadCount > 0
            ? "hsl(0 60% 22% / 0.75)"
            : "hsl(220 25% 12% / 0.55)";
      }}
    >
      {/* Three horizontal dots — stacked vertically like a side tab */}
      <div className="flex flex-col items-center gap-[5px]">
        <span
          className="block rounded-full"
          style={{
            width: "4px",
            height: "4px",
            background: unreadCount > 0 ? "hsl(0 85% 65%)" : "hsl(185 100% 60%)",
            boxShadow: `0 0 4px ${unreadCount > 0 ? "hsl(0 85% 55% / 0.7)" : "hsl(185 100% 50% / 0.5)"}`,
          }}
        />
        <span
          className="block rounded-full"
          style={{
            width: "4px",
            height: "4px",
            background: unreadCount > 0 ? "hsl(0 85% 65%)" : "hsl(185 100% 60%)",
            boxShadow: `0 0 4px ${unreadCount > 0 ? "hsl(0 85% 55% / 0.7)" : "hsl(185 100% 50% / 0.5)"}`,
          }}
        />
        <span
          className="block rounded-full"
          style={{
            width: "4px",
            height: "4px",
            background: unreadCount > 0 ? "hsl(0 85% 65%)" : "hsl(185 100% 60%)",
            boxShadow: `0 0 4px ${unreadCount > 0 ? "hsl(0 85% 55% / 0.7)" : "hsl(185 100% 50% / 0.5)"}`,
          }}
        />
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-orbitron font-bold text-[10px] leading-none animate-pulse"
          style={{
            background: "hsl(0 85% 55%)",
            color: "white",
            boxShadow: "0 0 8px hsl(0 85% 55% / 0.65)",
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}

      {/* Typing indicator */}
      {typingActive && unreadCount === 0 && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
          style={{
            background: "hsl(185 100% 60%)",
            boxShadow: "0 0 8px hsl(185 100% 60% / 0.7)",
          }}
        />
      )}
    </button>
  );
}
