// UC Delete Feedback — Customer deletes one of their own reviews (opened from the reviews page).
import { useEffect, useState } from "react";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";

/** feedback: the review to delete (null = closed) */
export default function DeleteFeedbackModal({ feedback, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [feedback]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/feedback?id=${feedback.feedbackId}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("This review cannot be deleted.");
      onDeleted(feedback);
    } catch (err) {
      setError(err instanceof TypeError ? "Cannot connect to the server." : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDeleteModal show={Boolean(feedback)} title="Delete your review?" busy={busy} error={error} onCancel={onClose} onConfirm={confirm}>
      Your review for <strong>{feedback?.serviceName}</strong> will be removed. This cannot be undone.
    </ConfirmDeleteModal>
  );
}
