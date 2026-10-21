import { useState } from "react";
import { useLocation } from "wouter";
import { getSocket, disconnectSocket } from "@/lib/socket";
import ConfirmModal from "@/components/common/ConfirmModal";
import { gameSessionStore } from "@/lib/gameSessionStore";

function clearGameState() {
  gameSessionStore.clearVolatileGameState();
}

/** Returns true when the player has been assigned a role (i.e. game is in progress). */
function isMidGame(): boolean {
  return !!gameSessionStore.getAssignedRole();
}

interface QuitGameButtonProps {
  playSound: () => void;
  onOpenModal?: () => void;
}

export function useQuitGame(isHost = false) {
  const [, setLocation] = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmQuit = () => {
    setShowConfirm(false);
    // Get room code before clearing state
    const roomCode = gameSessionStore.getRoomCode();
    clearGameState();
    setLocation("/");
    if (roomCode) {
      // Emit quit_game and wait for the server ack before disconnecting.
      // This prevents a race condition where the socket closes before the
      // server processes quit_game, which would cause the server's disconnect
      // handler to add the player to grace ("waiting to reconnect").
      const socket = getSocket();
      let disconnected = false;
      const doDisconnect = () => {
        if (disconnected) return;
        disconnected = true;
        disconnectSocket();
      };
      socket.emit("quit_game", { sessionId: roomCode }, doDisconnect);
      // Safety fallback: disconnect after 2s if the ack never arrives
      setTimeout(doDisconnect, 2000);
    } else {
      disconnectSocket();
    }
  };

  const midGame = isMidGame();

  return {
    isHost,
    midGame,
    showConfirm,
    openConfirm: () => setShowConfirm(true),
    closeConfirm: () => setShowConfirm(false),
    handleConfirmQuit,
  };
}

interface QuitGameButtonInnerProps {
  playSound: () => void;
  onRequestQuit: () => void;
}

export function QuitGameButtonInner({ playSound, onRequestQuit }: QuitGameButtonInnerProps) {
  const handleClick = () => {
    playSound();
    onRequestQuit();
  };

  return (
    <button
      onClick={handleClick}
      className="ix-btn flex items-center gap-3 px-3 py-2.5 rounded border transition-all duration-200 text-left font-orbitron text-xs tracking-[0.1em] uppercase hover:translate-x-1 w-full"
      style={{
        background: "hsl(0 60% 18%)",
        borderColor: "hsl(0 80% 40%)",
        color: "hsl(0 80% 65%)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "hsl(0 65% 23%)";
        e.currentTarget.style.boxShadow =
          "0 0 15px hsl(0 80% 50% / 0.4), inset 0 0 10px hsl(0 80% 50% / 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "hsl(0 60% 18%)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ fontSize: "1.2em" }}>🚪</span>
      <span className="flex-1">QUIT GAME</span>
      <span style={{ fontSize: "0.8em", opacity: 0.6 }}>→</span>
    </button>
  );
}

export default function QuitGameButton({ playSound, onOpenModal }: QuitGameButtonProps) {
  const { isHost, midGame, showConfirm, openConfirm, closeConfirm, handleConfirmQuit } = useQuitGame();

  const handleClick = () => {
    playSound();
    onOpenModal?.();
    openConfirm();
  };

  const warningMessage = isHost
    ? "⚠ You are the host. Quitting may end the game for all players."
    : midGame
      ? "⚠ Leaving will interrupt the game for all players."
      : undefined;

  return (
    <>
      <QuitGameButtonInner playSound={playSound} onRequestQuit={handleClick} />

      <ConfirmModal
        isOpen={showConfirm}
        title="Quit Game?"
        message="Are you sure you want to leave this game?"
        warning={warningMessage}
        confirmLabel="Quit"
        cancelLabel="Cancel"
        onConfirm={handleConfirmQuit}
        onCancel={closeConfirm}
      />
    </>
  );
}

