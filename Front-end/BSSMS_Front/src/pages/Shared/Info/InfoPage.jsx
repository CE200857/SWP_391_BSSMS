import { SITE } from "../../../siteConfig";
import "./InfoPage.css";

// Khung chung cho các trang thông tin: tiêu đề, đoạn mở đầu, các mục và thông tin liên hệ.
export default function InfoPage({ title, lead, children }) {
  return (
    <main className="info-page">
      <h1>{title}</h1>
      {lead && <p className="info-lead">{lead}</p>}
      {children}
      <p className="info-contact">
        Cần hỗ trợ thêm? Liên hệ <a href={`mailto:${SITE.email}`}>{SITE.email}</a> hoặc gọi{" "}
        <a href={`tel:${SITE.phoneLink}`}>{SITE.phoneDisplay}</a> ({SITE.hours}).
      </p>
    </main>
  );
}

export function InfoSection({ title, children }) {
  return (
    <section className="info-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
