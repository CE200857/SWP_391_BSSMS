import InfoPage, { InfoSection } from "./InfoPage";

export default function PrivacyPolicy() {
  return (
    <InfoPage title="Chính sách bảo mật" lead="Seoul Center cam kết bảo vệ thông tin cá nhân của khách hàng. Trang này giải thích chúng tôi thu thập gì, dùng vào việc gì và bạn có những quyền nào.">
      <InfoSection title="1. Thông tin chúng tôi thu thập">
        <ul>
          <li>Thông tin tài khoản và liên hệ: họ tên, tên đăng nhập, số điện thoại, email, ngày sinh, giới tính, địa chỉ.</li>
          <li>Thông tin chăm sóc: tình trạng da, dị ứng, ghi chú điều trị, kết quả điều trị và ảnh trước/sau điều trị (nếu có).</li>
          <li>Thông tin giao dịch: lịch hẹn, gói liệu trình, hóa đơn, thanh toán, voucher và đánh giá của bạn.</li>
        </ul>
      </InfoSection>
      <InfoSection title="2. Mục đích sử dụng">
        <ul>
          <li>Đặt lịch, phân công kỹ thuật viên, thực hiện và ghi nhận dịch vụ.</li>
          <li>Lập hóa đơn, thanh toán, hoàn tiền và áp dụng ưu đãi thành viên.</li>
          <li>Gửi mã xác thực qua email, nhắc lịch hẹn và nhắc gói liệu trình qua Zalo.</li>
          <li>Hiển thị đánh giá dịch vụ và cải thiện chất lượng phục vụ.</li>
        </ul>
      </InfoSection>
      <InfoSection title="3. Chia sẻ thông tin">
        <p>Seoul Center không bán thông tin cá nhân. Chúng tôi chỉ chia sẻ phần cần thiết với đơn vị xử lý thanh toán trực tuyến (VNPay), dịch vụ nhắn tin Zalo và dịch vụ gửi email để thực hiện đúng các chức năng nêu trên, hoặc khi cơ quan nhà nước có thẩm quyền yêu cầu theo quy định pháp luật.</p>
      </InfoSection>
      <InfoSection title="4. Ai được xem thông tin của bạn">
        <p>Nhân viên chỉ xem được dữ liệu phù hợp với vai trò của mình: lễ tân và quản lý xem hồ sơ để phục vụ, kỹ thuật viên chỉ xem lịch hẹn và hồ sơ của khách được phân công. Ảnh trước/sau điều trị chỉ khách hàng đó và nhân viên phụ trách buổi hẹn xem được. Tên bạn có thể hiển thị cùng đánh giá công khai.</p>
      </InfoSection>
      <InfoSection title="5. Lưu trữ và bảo mật">
        <p>Thông tin được lưu trên hệ thống của Seoul Center và chỉ truy cập sau khi đăng nhập. Hóa đơn và lịch sử giao dịch được giữ lại để đối chiếu và phục vụ nghĩa vụ kế toán. Vui lòng giữ kín mật khẩu và mã xác thực; không chia sẻ với người khác.</p>
      </InfoSection>
      <InfoSection title="6. Quyền của bạn">
        <ul>
          <li>Xem và cập nhật thông tin cá nhân trong mục \"Hồ sơ cá nhân\".</li>
          <li>Đổi mật khẩu bất cứ lúc nào; đổi email cần xác thực bằng mã gửi tới email mới.</li>
          <li>Xóa đánh giá của mình.</li>
          <li>Đề nghị ngừng sử dụng hoặc vô hiệu hóa tài khoản bằng cách liên hệ bộ phận chăm sóc khách hàng.</li>
        </ul>
      </InfoSection>
      <InfoSection title="7. Thay đổi chính sách">
        <p>Seoul Center có thể cập nhật chính sách này khi hệ thống thay đổi. Phiên bản mới có hiệu lực kể từ lúc được đăng trên trang này.</p>
      </InfoSection>
    </InfoPage>
  );
}
