import { Component } from "react";
import { Link } from "react-router-dom";

export default class RouteErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Cannot display the page", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="app-route-error" role="alert">
        <h2>This page cannot be displayed yet</h2>
        <p>The data may not have loaded correctly. You can try again or go back to the home page.</p>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
          <Link className="btn btn-outline-primary" to={this.props.home}>Back to main page</Link>
        </div>
      </section>
    );
  }
}
