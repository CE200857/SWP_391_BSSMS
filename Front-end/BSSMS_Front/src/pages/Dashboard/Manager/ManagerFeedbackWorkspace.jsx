import FeedbackModeration from "./FeedbackModeration";

export default function ManagerFeedbackWorkspace() {
  return (
    <section className="manager-feedback-workspace">
      <div className="ui-page-heading">
        <div>
          <h1>Quản lý đánh giá khách hàng</h1>
          <p>Tổng quan phản hồi và kiểm duyệt đánh giá tại cùng một nơi.</p>
        </div>
      </div>
      <FeedbackModeration managerCompact />
    </section>
  );
}
