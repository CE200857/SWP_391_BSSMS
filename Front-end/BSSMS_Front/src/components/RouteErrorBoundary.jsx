import { Component } from "react";
import { Link } from "react-router-dom";

export default class RouteErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Không thể hiển thị trang", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="app-route-error" role="alert">
        <h2>Chưa thể hiển thị trang này</h2>
        <p>Dữ liệu có thể chưa tải đúng. Bạn có thể thử lại hoặc quay về trang chính.</p>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => this.setState({ failed: false })}>
            Thử lại
          </button>
          <Link className="btn btn-outline-primary" to={this.props.home}>Về trang chính</Link>
        </div>
      </section>
    );
  }
}
