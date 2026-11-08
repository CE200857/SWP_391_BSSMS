import { Accordion } from "react-bootstrap";
import InfoPage from "./InfoPage";

const FAQ = [
  ["Làm thế nào để đặt lịch?",
   "Đăng nhập tài khoản khách hàng (hoặc đăng ký nếu chưa có), chọn \"Đặt lịch\", chọn dịch vụ, ngày giờ còn trống và kỹ thuật viên nếu bạn muốn. Lịch mới ở trạng thái \"Chờ xác nhận\" cho tới khi lễ tân xác nhận."],
  ["Spa làm việc vào những giờ nào?",
   "Seoul Center mở cửa 08:30–18:30 hằng ngày. Lịch hẹn được xếp trong khung giờ này."],
  ["Tôi có thể đổi hoặc hủy lịch hẹn không?",
   "Bạn đổi được lịch trước khi check-in. Bạn tự hủy được khi lịch còn ở trạng thái \"Chờ xác nhận\" hoặc \"Đã xác nhận\" và cần ghi lý do. Lịch bị hủy được giữ lại trong lịch sử, không bị xóa."],
  ["Nếu tôi đến muộn hoặc không đến thì sao?",
   "Lịch quá giờ mà bạn không đến sẽ được lễ tân đánh dấu \"Không đến\". Với gói liệu trình, buổi không đến hoặc bị hủy không bị trừ vào số buổi của bạn."],
  ["Gói liệu trình hoạt động thế nào?",
   "Bạn mua gói tại quầy hoặc trực tuyến qua VNPay. Gói chỉ dùng được sau khi thanh toán thành công, có số buổi và hạn dùng ghi trên từng gói; mỗi buổi hoàn thành sẽ trừ một buổi. Bạn theo dõi số buổi còn lại ở mục \"Liệu trình của tôi\"."],
  ["Seoul Center nhận những hình thức thanh toán nào?",
   "Tiền mặt, chuyển khoản tại quầy và thanh toán trực tuyến qua VNPay."],
  ["Tôi được hưởng ưu đãi thành viên nào?",
   "Khi có đủ 10 lượt hẹn hoàn thành, bạn tự động lên hạng VIP: giảm 10% dịch vụ và sản phẩm, kèm voucher 300.000đ mỗi tháng cho dịch vụ chăm sóc da. Trong tháng sinh nhật bạn có thêm voucher điều trị chuyên sâu 800.000đ và giảm thêm 10% (dùng một lần). Ưu đãi giảm giá theo hạng không áp dụng cho gói liệu trình. Xem chi tiết ở mục \"Quyền lợi thành viên\"."],
  ["Làm sao để lấy lại mật khẩu khi quên?",
   "Chọn \"Quên mật khẩu\" ở trang đăng nhập, nhập email đã đăng ký. Hệ thống gửi mã xác thực gồm 6 chữ số tới email của bạn; mã chỉ có hiệu lực trong thời gian ngắn nên hãy nhập ngay."],
  ["Tôi có nhận được nhắc lịch không?",
   "Có. Hệ thống gửi nhắc lịch hẹn trước 24 giờ và nhắc khi gói liệu trình sắp hết hạn hoặc sắp hết buổi qua Zalo, nếu số điện thoại của bạn đang dùng Zalo."],
  ["Tôi có thể đánh giá dịch vụ ở đâu?",
   "Sau khi hoàn thành dịch vụ, vào \"Đánh giá của tôi\" để viết đánh giá. Mỗi dịch vụ trong mỗi lần đến được đánh giá một lần; bạn sửa hoặc xóa đánh giá của mình bất cứ lúc nào. Đánh giá vi phạm quy định có thể bị quản lý ẩn."],
  ["Hóa đơn có thể được hủy hoặc hoàn tiền không?",
   "Việc hủy hóa đơn và hoàn tiền do quản lý thực hiện, hóa đơn không bị xóa mà chuyển sang trạng thái \"Đã hủy\" hoặc \"Đã hoàn tiền\". Gói liệu trình đã sử dụng buổi thì không hủy được. Vui lòng liên hệ quầy để được hỗ trợ."],
];

export default function FaqPage() {
  return (
    <InfoPage title="Câu hỏi thường gặp" lead="Những điều khách hàng thường hỏi khi đặt lịch và sử dụng dịch vụ tại Seoul Center.">
      <Accordion alwaysOpen>
        {FAQ.map(([question, answer], index) => (
          <Accordion.Item eventKey={String(index)} key={question}>
            <Accordion.Header>{question}</Accordion.Header>
            <Accordion.Body>{answer}</Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </InfoPage>
  );
}
