// UC Update Membership Tiers — Manager edits the benefit description of a tier.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { put, money } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";

/** tier: the tier to edit (null = closed) */
export default function UpdateMembershipTierModal({ tier, onClose, onSaved }) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tier) { setDescription(tier.description || ""); setError(""); }
  }, [tier]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const r = await put(`/api/membership-tiers?id=${tier.membershipTierId}`, { description });
      onSaved(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={Boolean(tier)} onHide={() => !saving && onClose()} centered>
      <Modal.Header closeButton><Modal.Title>Tier benefits {tier?.tierName}</Modal.Title></Modal.Header>
      {tier && (
        <Modal.Body>
          <FloatingAlert message={error} onClose={() => setError("")} />
          <p className="text-muted small">Spending from {money(tier.minSpending)} · discount {Number(tier.discountPercent)}% for services and treatment packages.</p>
          <Form.Control as="textarea" rows={4} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Form.Text>{description.length}/500 characters</Form.Text>
        </Modal.Body>
      )}
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={save} disabled={saving}>Save</Button>
      </Modal.Footer>
    </Modal>
  );
}
