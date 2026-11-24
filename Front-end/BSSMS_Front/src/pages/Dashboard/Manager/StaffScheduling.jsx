// UC View/Create/Update Staff Scheduling & Skills — Manager assigns weekly shifts and technician skills.
import { Fragment, useMemo, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { today, addDays, viDate, time5 } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";
import { WEEKDAYS, mondayOf, shiftShort, useOperations } from "./operationsShared";
import { writeScheduling } from "./operationsWrite";
import CreateShiftModal from "./CreateShiftModal";
import UpdateShiftModal from "./UpdateShiftModal";
import DeleteShiftModal from "./DeleteShiftModal";
import UpdateSkillsModal from "./UpdateSkillsModal";

export default function StaffScheduling() {
  const [week, setWeek] = useState(mondayOf(today()));
  const [tab, setTab] = useState("shifts");
  const { data, error, loading, load, setError } = useOperations("scheduling", week);
  const [notice, setNotice] = useState("");
  const [create, setCreate] = useState(null);
  const [edit, setEdit] = useState(null);
  const [deleteShift, setDeleteShift] = useState(null);
  const [skills, setSkills] = useState(null);
  const [busy, setBusy] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);

  // Copy-week stays here; create/update/delete shift and skills live in their own modal files
  const afterChange = (message) => {
    setNotice(message);
    setCreate(null);
    setEdit(null);
    setDeleteShift(null);
    setSkills(null);
    load();
  };
  const copyWeek = async () => {
    setBusy(true);
    try {
      const r = await writeScheduling({ action: "copyWeek", fromDate: week, toDate: addDays(week, 7) });
      setNotice(r.message);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const shiftOf = (staffId, day) => (data?.shifts || []).find((s) => s.staffId === staffId && String(s.shiftDate).slice(0, 10) === day);
  const onLeave = (staffId, day) => (data?.leaves || []).some((l) => l.staffId === staffId && String(l.startDate).slice(0, 10) <= day && String(l.endDate).slice(0, 10) >= day);
  const skillIds = (staffId) => (data?.skills || []).filter((s) => s.staffId === staffId).map((s) => s.serviceId);
  const technicians = (data?.staff || []).filter((s) => s.role === "Technician");

  const staff = data?.staff || [];
  const groups = [
    ["Technicians", staff.filter((x) => x.role === "Technician")],
    ["Receptionists", staff.filter((x) => x.role === "Receptionist")],
    ["Managers", staff.filter((x) => x.role === "Manager")],
  ].filter(([, list]) => list.length);
  const onDuty = (d) => staff.filter((x) => shiftOf(x.staffId, d) && !onLeave(x.staffId, d)).length;
  const initial = (name = "") => name.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() || "?";
  const isThisWeek = week === mondayOf(today());

  return (
    <div className="ss-page">
      <section className="ms-card ss-toolbar">
        <div className="desk-filter mb-0" role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={tab === "shifts"} className={tab === "shifts" ? "active" : ""} onClick={() => setTab("shifts")}>
            <i className="bi bi-calendar-week me-1" aria-hidden="true" /> Weekly shifts
          </button>
          <button type="button" role="tab" aria-selected={tab === "skills"} className={tab === "skills" ? "active" : ""} onClick={() => setTab("skills")}>
            <i className="bi bi-stars me-1" aria-hidden="true" /> Technician skills
          </button>
        </div>
        {tab === "shifts" && (
          <>
            <div className="ms-week-nav">
              <button type="button" className="ms-icon-btn" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
              <strong>{viDate(week).slice(0, 5)} – {viDate(addDays(week, 6))}</strong>
              <button type="button" className="ms-icon-btn" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
              {!isThisWeek && <button type="button" className="ms-pill-btn" onClick={() => setWeek(mondayOf(today()))}>This week</button>}
            </div>
            <div className="ss-actions">
              <Button variant="outline-primary" className="desk-btn" disabled={busy} onClick={copyWeek}>
                <i className="bi bi-files" aria-hidden="true" /> Copy to next week
              </Button>
              <Button className="desk-btn" onClick={() => setCreate({ staffIds: [], dates: [], shiftType: "FullDay" })}>
                <i className="bi bi-plus-lg" aria-hidden="true" /> Assign shifts
              </Button>
            </div>
          </>
        )}
      </section>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

      {loading && !data ? <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div> : tab === "shifts" ? (
        <section className="ms-card p-0 overflow-hidden">
          <div className="ss-legend">
            <span className="ss-chip ss-chip--FullDay">Full day</span>
            <span className="ss-chip ss-chip--Morning">Morning</span>
            <span className="ss-chip ss-chip--Afternoon">Afternoon</span>
            <span className="ss-chip ss-chip--leave">On leave</span>
            <small>Click a shift to change it, or an empty cell to add one.</small>
          </div>
          <div className="table-responsive">
            <table className="ss-table">
              <thead>
                <tr>
                  <th className="ss-staff-col">Staff</th>
                  {days.map((d, i) => (
                    <th key={d} className={d === today() ? "is-today" : undefined}>
                      <span>{WEEKDAYS[i].slice(0, 3)}</span>
                      <strong>{viDate(d).slice(0, 5)}</strong>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map(([title, list]) => (
                  <Fragment key={title}>
                    <tr className="ss-group"><td colSpan={8}>{title} <span>{list.length}</span></td></tr>
                    {list.map((x) => (
                      <tr key={x.staffId}>
                        <td className="ss-staff-col"><div className="ss-staff">
                          <span className="ctp-avatar" aria-hidden="true">{initial(x.fullName)}</span>
                          <strong>{x.fullName}</strong>
                        </div></td>
                        {days.map((d) => {
                          const shift = shiftOf(x.staffId, d);
                          const past = d < today();
                          const cls = d === today() ? "is-today" : undefined;
                          if (onLeave(x.staffId, d)) return <td key={d} className={cls}><span className="ss-chip ss-chip--leave">On leave</span></td>;
                          if (past) return <td key={d} className={cls}>{shift ? <span className={`ss-chip ss-chip--${shift.shiftType} is-past`}>{shiftShort[shift.shiftType]}</span> : <span className="ss-none">—</span>}</td>;
                          return (
                            <td key={d} className={cls}>
                              {shift ? (
                                <button type="button" className={`ss-chip ss-chip--${shift.shiftType}`} onClick={() => setEdit({ ...shift, shiftType: shift.shiftType })} aria-label={`${x.fullName}, ${viDate(d)}: ${shiftShort[shift.shiftType]}. Change`}>
                                  {shiftShort[shift.shiftType]}
                                  {shift.startTime && <small>{time5(shift.startTime)}–{time5(shift.endTime)}</small>}
                                </button>
                              ) : (
                                <button type="button" className="ss-add" aria-label={`Add a shift for ${x.fullName} on ${viDate(d)}`} onClick={() => setCreate({ staffIds: [x.staffId], dates: [d], shiftType: "FullDay" })}>
                                  <i className="bi bi-plus-lg" aria-hidden="true" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="ss-staff-col">On duty</td>
                  {days.map((d) => <td key={d} className={d === today() ? "is-today" : undefined}><strong>{onDuty(d)}</strong> / {staff.length}</td>)}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : (
        <section className="ms-card">
          <header className="ms-card-head"><h4>Technician skills</h4><span>{technicians.length}</span></header>
          <div className="ss-skills">
            {technicians.map((t) => {
              const mine = (data?.skills || []).filter((x) => x.staffId === t.staffId);
              return (
                <article key={t.staffId} className="ss-skill">
                  <div className="ss-skill-head">
                    <span className="ctp-avatar" aria-hidden="true">{initial(t.fullName)}</span>
                    <div><strong>{t.fullName}</strong><small>{mine.length} service{mine.length === 1 ? "" : "s"}</small></div>
                    <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit ms-auto" onClick={() => setSkills({ staffId: t.staffId, fullName: t.fullName, serviceIds: skillIds(t.staffId) })}>
                      <i className="bi bi-pencil-square" aria-hidden="true" /> Edit
                    </Button>
                  </div>
                  <div className="ss-skill-tags">
                    {mine.length ? mine.map((x) => <span key={x.serviceId}>{x.serviceName}</span>) : <em>No skills yet</em>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <CreateShiftModal initial={create} staff={staff} days={days} onClose={() => setCreate(null)} onSaved={afterChange} />
      <UpdateShiftModal shift={edit} onClose={() => setEdit(null)} onSaved={afterChange} onRequestDelete={(shift) => { setEdit(null); setDeleteShift(shift); }} />
      <DeleteShiftModal shift={deleteShift} onClose={() => setDeleteShift(null)} onDeleted={afterChange} />
      <UpdateSkillsModal target={skills} services={data?.services || []} onClose={() => setSkills(null)} onSaved={afterChange} />
    </div>
  );
}
