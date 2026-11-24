// UC Delete Room — confirmation dialog opened from the Rooms & beds page.
import { useEffect, useState } from "react";
import { del } from "../../../../services/api";
import ConfirmDeleteModal from "../../../../components/ConfirmDeleteModal";

/** room: the room to delete (null = closed) */
export default function DeleteRoomModal({ room, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [room]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await del(`/api/rooms?id=${room.roomId}`);
      onDeleted(r?.message || "Room deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDeleteModal show={Boolean(room)} title="Delete room" busy={busy} error={error} onCancel={onClose} onConfirm={confirm}>
      <p className="mb-0">Delete room <strong>{room?.roomName}</strong>?</p>
    </ConfirmDeleteModal>
  );
}
