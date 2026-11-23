import FeedbackModeration from "./FeedbackModeration";

export default function ManagerFeedbackWorkspace() {
  return (
    <section className="manager-feedback-workspace">
      <div className="ui-page-heading">
        <div>
          <h1>Customer review management</h1>
          <p>Feedback overview and review moderation in one place.</p>
        </div>
      </div>
      <FeedbackModeration managerCompact />
    </section>
  );
}
