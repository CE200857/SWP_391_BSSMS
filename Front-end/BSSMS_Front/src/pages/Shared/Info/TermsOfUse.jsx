import InfoPage, { InfoSection } from "./InfoPage";

export default function TermsOfUse() {
  return (
    <InfoPage title="Điều khoản sử dụng" lead="Khi tạo tài khoản và sử dụng hệ thống đặt lịch của Seoul Center, bạn đồng ý với các điều khoản dưới đây.">
      <InfoSection title="1. Tài khoản">
        <ul>
          <li>Bạn cung cấp thông tin chính xác (họ tên, số điện thoại, email, ngày sinh) và cập nhật khi có thay đổi.</li>
          <li>Bạn chịu trách nhiệm giữ bí mật mật khẩu và mã xác thực của mình.</li>
          <li>Mỗi tài khoản dành cho một khách hàng; Seoul Center có thể vô hiệu hóa tài khoản vi phạm điều khoản.</li>
        </ul>
      </InfoSection>
      <InfoSection title="2. Đặt lịch, đổi và hủy lịch">
        <ul>
          <li>Lịch hẹn nằm trong giờ làm việc 08:30–18:30 và chỉ được xác nhận khi còn kỹ thuật viên, phòng và thiết bị phù hợp.</li>
          <li>Bạn đổi lịch trước khi check-in và hủy lịch khi lịch còn \"Chờ xác nhận\" hoặc \"Đã xác nhận\", kèm lý do.</li>
          <li>Lịch quá giờ mà bạn không đến được ghi nhận là \"Không đến\".</li>
          <li>Vui lòng khai báo đúng tình trạng da và dị ứng để kỹ thuật viên tư vấn và thực hiện an toàn.</li>
        </ul>
      </InfoSection>
      <InfoSection title="3. Gói liệu trình">
        <ul>
          <li>Gói có số buổi, giá và hạn dùng ghi trên từng gói; hạn dùng tính từ ngày mua.</li>
          <li>Gói chỉ sử dụng được sau khi thanh toán thành công. Mỗi buổi hoàn thành trừ một buổi; buổi bị hủy hoặc không đến không bị trừ.</li>
          <li>Gói hết hạn hoặc hết buổi không thể tiếp tục sử dụng. Gói đã sử dụng buổi không được hủy hóa đơn.</li>
        </ul>
      </InfoSection>
      <InfoSection title="4. Thanh toán, hoàn tiền và ưu đãi">
        <ul>
          <li>Chấp nhận tiền mặt, chuyển khoản tại quầy và thanh toán trực tuyến qua VNPay.</li>
          <li>Hóa đơn không bị xóa; việc hủy hóa đơn và hoàn tiền do quản lý xem xét và thực hiện.</li>
          <li>Ưu đãi hạng thành viên, voucher và ưu đãi sinh nhật áp dụng theo điều kiện, hạn dùng và số lần dùng của từng ưu đãi; ưu đãi giảm giá theo hạng không áp dụng cho gói liệu trình.</li>
        </ul>
      </InfoSection>
      <InfoSection title="5. Đánh giá của khách hàng">
        <p>Bạn chỉ đánh giá những dịch vụ mình đã hoàn thành. Nội dung đánh giá cần trung thực, không chứa lời lẽ xúc phạm hoặc thông tin sai sự thật; Seoul Center có thể ẩn đánh giá vi phạm.</p>
      </InfoSection>
      <InfoSection title="6. Trách nhiệm">
        <p>Kết quả chăm sóc có thể khác nhau tùy cơ địa mỗi người. Seoul Center nỗ lực cung cấp dịch vụ và thông tin chính xác, nhưng không chịu trách nhiệm với thiệt hại phát sinh do thông tin bạn khai báo không đúng hoặc do sự cố ngoài tầm kiểm soát (đường truyền, cổng thanh toán, dịch vụ nhắn tin).</p>
      </InfoSection>
      <InfoSection title="7. Thay đổi điều khoản">
        <p>Điều khoản có thể được cập nhật khi dịch vụ hoặc quy định thay đổi. Việc tiếp tục sử dụng hệ thống sau khi cập nhật được hiểu là bạn đồng ý với nội dung mới.</p>
      </InfoSection>
    </InfoPage>
  );
}
