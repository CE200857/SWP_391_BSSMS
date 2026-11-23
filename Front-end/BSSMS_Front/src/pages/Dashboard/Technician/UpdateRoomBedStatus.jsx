import { useCallback, useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { api, time5, label } from "../../../services/api";
import "./UpdateRoomBedStatus.css";
import FloatingAlert from "../../../components/FloatingAlert";

// Read-only board: beds are assigned by the system and freed when technicians start/complete services
const bedState = (bed, roomMaintenance) =>
  roomMaintenance || bed.status !== "Active" ? "maintenance" : bed.useState === "InUse" ? "busy" : "free";
const stateText = { free: "Available", busy: "In use", maintenance: "Maintenance" };

export default function UpdateRoomBedStatus() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api("/api/room-bed-status"));
      setUpdatedAt(new Date());
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const s = data?.summary;
  return (
    <Container fluid className="mt-4 px-4 room-bed-page">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Room status & beds</h2>
          <p className="text-muted mb-0">
            Beds are assigned automatically and update when a service starts or finishes.
            {updatedAt && <> Last updated {updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.</>}
          </p>
        </div>
        <Button variant="outline-primary" className="desk-btn" onClick={load}>
          <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
        </Button>
      </div>
      <FloatingAlert message={error} onClose={() => setError("")} />

      {s && (
        <div className="rb-summary" aria-label="Bed summary">
          <span className="rb-chip rb-chip--free"><i className="rb-dot" aria-hidden="true" /> Available <strong>{s.free}</strong></span>
          <span className="rb-chip rb-chip--busy"><i className="rb-dot" aria-hidden="true" /> In use <strong>{s.inUse}</strong></span>
          <span className="rb-chip rb-chip--maintenance"><i className="rb-dot" aria-hidden="true" /> Maintenance <strong>{s.maintenance}</strong></span>
        </div>
      )}
      {!data && !error && <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>}

      <div className="rb-rooms">
        {(data?.rooms || []).map((room) => {
          const roomMaintenance = room.status === "Maintenance";
          return (
            <section key={room.roomId} className={`rb-room${roomMaintenance ? " rb-room--off" : ""}`}>
              <header className="rb-room-head">
                <div>
                  <h3>{room.roomName}</h3>
                  <span>{label(room.roomType)}</span>
                </div>
                {roomMaintenance && <span className="rb-room-tag">Maintenance</span>}
              </header>
              {room.beds.length === 0 ? (
                <p className="text-muted mb-0">This room has no beds yet.</p>
              ) : (
                <div className="rb-beds">
                  {room.beds.map((bed) => {
                    const st = bedState(bed, roomMaintenance);
                    return (
                      <div key={bed.bedId} className={`rb-bed rb-bed--${st}`}>
                        <div className="rb-bed-top">
                          <strong>{bed.bedNumber}</strong>
                          <span><i className="rb-dot" aria-hidden="true" /> {stateText[st]}</span>
                        </div>
                        {st === "busy" && bed.appointmentId && (
                          <div className="rb-bed-who">
                            {bed.customerName}
                            <small>{time5(bed.startTime)}–{time5(bed.endTime)}{bed.technicianName ? ` · ${bed.technicianName}` : ""}</small>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Container>
  );
}
