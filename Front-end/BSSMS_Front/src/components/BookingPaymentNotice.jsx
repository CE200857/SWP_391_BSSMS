import { Link } from "react-router-dom";

export default function BookingPaymentNotice({ packageBooking = false }) {
  return (
    <aside className="booking-payment-notice" aria-label="Thông tin thanh toán">
      <i className="bi bi-info-circle" aria-hidden="true" />
      <div>
        <p className="mt-0">
          {packageBooking
            ? "Buổi hẹn này được tính trong gói bạn đã mua."
            : "Khi gửi yêu cầu đặt lịch, hệ thống chưa thu tiền và chưa có mã QR. Bạn thanh toán tại quầy hoặc qua VNPay sau buổi hẹn."}
          {" "}Yêu cầu mới đang chờ xử lý; lễ tân chưa xác nhận lịch.
          {" "}<Link to="/appointments">Xem lịch hẹn của tôi</Link>
        </p>
      </div>
    </aside>
  );
}
