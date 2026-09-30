import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-white border-top text-center py-4 mt-auto">
      <Container>
        <p className="mb-1 fw-bold text-dark">
          Beauty Salon & Spa Management System
        </p>
        <p className="mb-0 text-muted" style={{ fontSize: "14px" }}>
          &copy; {new Date().getFullYear()} Bản quyền thuộc về Nhóm phát triển
          dự án.
        </p>
        <p className="mb-0 text-muted" style={{ fontSize: "14px" }}>
          Địa chỉ liên hệ: SWP391_SE2002.2_Group3
        </p>
      </Container>
    </footer>
  );
};

export default Footer;