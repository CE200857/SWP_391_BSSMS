// UC Delete Voucher — soft delete: removed from the list, kept in the DB for invoices that used it.
import { useEffect, useState } from "react";
import { del } from "../../../../services/api";
import ConfirmDeleteModal from "../../../../components/ConfirmDeleteModal";

/** voucher: the voucher to delete (null = closed) */
export default function DeleteVoucherModal({ voucher, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [voucher]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await del(`/api/vouchers?id=${voucher.voucherId}`);
      onDeleted(r?.message || "Voucher deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDeleteModal show={Boolean(voucher)} title="Delete voucher" busy={busy} error={error} onCancel={onClose} onConfirm={confirm}>
      <p className="mb-2">Delete voucher <strong>{voucher?.voucherCode}</strong>?</p>
      <p className="text-muted small mb-0">It is removed from the list and can no longer be used. Invoices that already used it are kept.</p>
    </ConfirmDeleteModal>
  );
}
