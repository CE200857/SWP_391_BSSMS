// Shared helpers for the staff operations pages (no page logic here).
import { useCallback, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { api, today, addDays, viDate } from "../../../services/api";

export const SHIFT_TYPES = ["Morning", "Afternoon", "FullDay"];
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const leaveBg = { Pending: "warning", Approved: "success", Rejected: "danger", Cancelled: "secondary" };
export const mondayOf = (iso) => {
  const d = new Date(iso + "T00:00:00Z");
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -offset);
};
export const shiftShort = { Morning: "Morning", Afternoon: "Afternoon", FullDay: "Full day" };

export function useOperations(kind, date) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/api/operations/${kind}${date ? `?date=${date}` : ""}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [kind, date]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, load, setError };
}

export function WeekPicker({ week, setWeek }) {
  return (
    <div className="d-flex gap-2 align-items-center">
      <Button variant="outline-secondary" onClick={() => setWeek(addDays(week, -7))}><i className="bi bi-chevron-left" /></Button>
      <strong>{viDate(week)} – {viDate(addDays(week, 6))}</strong>
      <Button variant="outline-secondary" onClick={() => setWeek(addDays(week, 7))}><i className="bi bi-chevron-right" /></Button>
      <Button variant="link" onClick={() => setWeek(mondayOf(today()))}>This week</Button>
    </div>
  );
}
