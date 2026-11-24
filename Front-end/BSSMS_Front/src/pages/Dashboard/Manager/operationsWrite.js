// Small helper used by the scheduling modals: one POST to /api/operations/scheduling.
import { post } from "../../../services/api";
export const writeScheduling = (body) => post("/api/operations/scheduling", body);
