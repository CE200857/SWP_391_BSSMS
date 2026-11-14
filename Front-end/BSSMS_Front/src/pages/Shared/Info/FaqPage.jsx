import { Accordion } from "react-bootstrap";
import InfoPage from "./InfoPage";

const FAQ = [
  ["Làm thế nào để đặt lịch?",
   "Đăng nhập tài khoản khách hàng (hoặc đăng ký nếu chưa có), chọn \"Đặt lịch\", chọn từ 1 đến 4 dịch vụ (làm liên tiếp), ngày giờ còn trống và kỹ thuật viên nếu bạn muốn. Lịch online cần đặt trước ít nhất 2 tiếng và tối đa 30 ngày; lịch mới ở trạng thái \"Chờ xác nhận\" cho tới khi lễ tân xác nhận."],
  ["Spa làm việc vào những giờ nào?",
   "Seoul Center mở cửa 08:30–18:30 hằng ngày. Lịch hẹn được xếp trong khung giờ này."],
  ["Tôi có thể đổi hoặc hủy lịch hẹn không?",
   "Bạn tự đổi hoặc hủy lịch trước giờ hẹn ít nhất 2 tiếng khi lịch còn \"Chờ xác nhận\" hoặc \"Đã xác nhận\" (cần ghi lý do); sau khi đổi, lịch chờ lễ tân xác nhận lại. Nếu đã thanh toán, quản lý sẽ xử lý hoàn tiền khi bạn hủy."],
  ["Nếu tôi đến muộn hoặc không đến thì sao?",
   "Nếu bạn đến trễ quá 15 phút, lễ tân có thể đánh dấu lịch \"Không đến\"; khoản đã thanh toán cho lịch không đến không được hoàn. Với gói liệu trình, buổi không đến hoặc bị hủy không bị trừ vào số buổi của bạn."],
  ["Gói liệu trình hoạt động thế nào?",
   "Bạn mua gói tại quầy hoặc trực tuyến qua VNPay. Gói chỉ dùng được sau khi thanh toán thành công, có số buổi và hạn dùng ghi trên từng gói; mỗi buổi hoàn thành sẽ trừ một buổi. Bạn theo dõi số buổi còn lại ở mục \"Liệu trình của tôi\"."],
  ["Seoul Center nhận những hình thức thanh toán nào?",
   "Tiền mặt, chuyển khoản tại quầy và thanh toán trực tuyến qua VNPay."],
  ["Tôi được hưởng ưu đãi thành viên nào?",
   "Hạng thành viên (Standard, Silver, Gold, VIP, VVIP) được xét tự động theo tổng chi tiêu trọn đời. Mỗi hạng có mức giảm riêng cho dịch vụ và gói liệu trình; voucher (nếu có) được áp dụng sau ưu đãi hạng và tổng giảm tối đa 50% hóa đơn. Xem chi tiết ở mục \"Quyền lợi thành viên\"."],
  ["Làm sao để lấy lại mật khẩu khi quên?",
   "Chọn \"Quên mật khẩu\" ở trang đăng nhập, nhập email đã đăng ký. Hệ thống gửi mã xác thực gồm 6 chữ số tới email của bạn; mã chỉ có hiệu lực trong thời gian ngắn nên hãy nhập ngay."],
    ["Tôi có thể đánh giá dịch vụ ở đâu?",
   "Sau khi hoàn thành dịch vụ, vào \"Đánh giá của tôi\" để viết đánh giá. Mỗi dịch vụ trong mỗi lần đến được đánh giá một lần; bạn sửa hoặc xóa đánh giá của mình bất cứ lúc nào. Đánh giá vi phạm quy định có thể bị quản lý ẩn."],
  ["Hóa đơn có thể được hủy hoặc hoàn tiền không?",
   "Việc hủy hóa đơn và hoàn tiền do quản lý thực hiện, hóa đơn không bị xóa mà chuyển sang trạng thái \"Đã hủy\" hoặc \"Đã hoàn tiền\". Thanh toán VNPay được hoàn qua VNPay; tiền mặt/chuyển khoản được hoàn tại quầy. Vui lòng liên hệ quầy để được hỗ trợ."],
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
