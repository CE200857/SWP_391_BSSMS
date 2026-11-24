// Page shell: picks the operations page by `kind`. Each function lives in its own file,
// so an error in one (e.g. leave approval) does not take down the others.
import { Container } from "react-bootstrap";
import StaffScheduling from "./StaffScheduling";
import ApproveLeave from "./ApproveLeave";
import DailyTourReport from "./DailyTourReport";
import MyWorkSchedule from "./MyWorkSchedule";

const TITLES = {
  scheduling: ["Shifts & skills", "Assign weekly shifts and update the services each technician can perform."],
  leaves: ["Leave approval", "View the affected appointments before approving a leave request."],
  "tour-report": ["Tour report", "Each technician’s tours for the day under the rotation rule."],
  "my-schedule": ["My work schedule", "View this week’s shifts and submit leave requests."],
};

export default function OperationsWorkspace({ kind = "scheduling" }) {
  const [title, subtitle] = TITLES[kind] || TITLES.scheduling;
  return (
    <Container fluid className="mt-4 px-4">
      <h2 className="manager-page-title fw-bold mb-1">{title}</h2>
      <p className="text-muted mb-4">{subtitle}</p>
      {kind === "scheduling" && <StaffScheduling />}
      {kind === "leaves" && <ApproveLeave />}
      {kind === "tour-report" && <DailyTourReport />}
      {kind === "my-schedule" && <MyWorkSchedule />}
    </Container>
  );
}
