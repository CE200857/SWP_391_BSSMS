import { useState } from "react";
import { Link } from "react-router-dom";
import treatmentPhoto from "../../../assets/figma/login-spa-original.jpeg";
import facialPhoto from "../../../assets/figma/service-card-exact-01.png";
import massagePhoto from "../../../assets/figma/service-card-exact-03.png";
import hairPhoto from "../../../assets/figma/service-card-exact-05.png";
import carePhoto from "../../../assets/figma/service-card-exact-08.png";
import spaPhoto from "../../../assets/figma/service-card-19.png";
import relaxPhoto from "../../../assets/figma/service-card-20.png";

const services = [
  {
    category: "CHĂM SÓC DA",
    title: "Chăm sóc da mặt",
    description: "Liệu trình chăm sóc làn da theo nhu cầu, bắt đầu từ bước tư vấn.",
    image: facialPhoto,
  },
  {
    category: "THƯ GIÃN CƠ THỂ",
    title: "Massage thư giãn",
    description: "Tạm gác nhịp sống vội vàng, tận hưởng khoảng thời gian thư thái.",
    image: massagePhoto,
  },
  {
    category: "CHĂM SÓC TÓC",
    title: "Gội đầu dưỡng sinh",
    description: "Chăm sóc tóc và da đầu kết hợp những động tác massage nhẹ nhàng.",
    image: hairPhoto,
  },
  {
    category: "SALON",
    title: "Tạo kiểu & chăm sóc tóc",
    description: "Khám phá kiểu tóc phù hợp để tự tin thể hiện phong cách riêng.",
    image: carePhoto,
  },
];

const features = [
  {
    icon: "bi-chat-heart",
    title: "Lắng nghe nhu cầu",
    text: "Cùng tìm lựa chọn chăm sóc phù hợp với mong muốn của bạn.",
  },
  {
    icon: "bi-flower1",
    title: "Không gian thư giãn",
    text: "Một nhịp chậm giữa ngày bận rộn, để bạn thoải mái tận hưởng.",
  },
  {
    icon: "bi-calendar-heart",
    title: "Chủ động lịch hẹn",
    text: "Chọn thời gian thuận tiện và nhận xác nhận trước khi đến.",
  },
];

const steps = [
  {
    number: "01",
    icon: "bi-stars",
    title: "Chọn dịch vụ",
    text: "Khám phá dịch vụ, tìm hiểu để được tư vấn và lựa chọn.",
  },
  {
    number: "02",
    icon: "bi-calendar2-week",
    title: "Gửi lịch hẹn",
    text: "Đặt lịch trong khung giờ bạn muốn đến.",
  },
  {
    number: "03",
    icon: "bi-heart",
    title: "Xác nhận & tận hưởng",
    text: "Nhận xác nhận từ Seoul Center, rồi dành thời gian cho mình.",
  },
];

const testimonials = [
  {
    initials: "MA",
    name: "Minh Anh",
    service: "Chăm sóc da mặt",
    quote: "Mình thích cách được lắng nghe trước khi chọn dịch vụ. Buổi chăm sóc nhẹ nhàng, đúng là một khoảng nghỉ cho bản thân.",
  },
  {
    initials: "TV",
    name: "Thảo Vy",
    service: "Gội đầu dưỡng sinh",
    quote: "Sau một tuần bận rộn, được chăm sóc tận tình khiến mình thấy dễ chịu hơn nhiều. Mình muốn dành thời gian này thường xuyên hơn.",
  },
  {
    initials: "NL",
    name: "Ngọc Linh",
    service: "Massage thư giãn",
    quote: "Từ lúc đặt lịch đến khi đến nơi đều thuận tiện. Không gian nhẹ nhàng giúp mình có thể thật sự thư giãn.",
  },
];

const questions = [
  {
    question: "Có cần đăng nhập để xem dịch vụ và đặt lịch không?",
    answer: "Bạn có thể xem thông tin dịch vụ mà không cần đăng nhập. Để xem lịch trống, đặt lịch và theo dõi lịch hẹn, bạn cần đăng nhập tài khoản khách hàng.",
  },
  {
    question: "Tôi nên chọn dịch vụ nào cho lần đầu tiên?",
    answer: "Bạn có thể xem mô tả dịch vụ trước, sau đó liên hệ Seoul Center để được tư vấn theo nhu cầu của mình.",
  },
  {
    question: "Chi phí và thời gian chăm sóc được tính như thế nào?",
    answer: "Chi phí và thời lượng được hiển thị tại trang chi tiết từng dịch vụ. Nhân viên sẽ xác nhận thông tin trước khi bạn đến.",
  },
  {
    question: "Tôi có thể thay đổi lịch hẹn không?",
    answer: "Bạn có thể liên hệ trực tiếp với Seoul Center để được hỗ trợ thay đổi lịch hẹn.",
  },
  {
    question: "Tôi cần chuẩn bị gì trước khi đến?",
    answer: "Bạn chỉ cần đến đúng giờ đã hẹn. Nếu có lưu ý riêng về sức khỏe hoặc nhu cầu chăm sóc, hãy chia sẻ với nhân viên khi được tư vấn.",
  },
];

const GuestHome = ({ user }) => {
  const servicesPath = user?.role === "Customer" ? "/services" : "/guest/services";
  const [activeQuestion, setActiveQuestion] = useState(0);

  return (
  <div className="seoul-home">
    <section className="home-hero">
      <div className="home-container home-hero-grid">
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            <i className="bi bi-stars" aria-hidden="true" />
            SEOUL CENTER · SALON &amp; SPA
          </span>
          <h1>
            Một khoảng nghỉ.
            <br />
            Một phiên bản
            <br />
            <span>rạng rỡ hơn.</span>
          </h1>
          <p>
            Dành một chút thời gian chăm sóc bản thân. Khám phá dịch vụ chăm
            sóc sắc đẹp và thư giãn trong không gian nhẹ nhàng tại Seoul Center.
          </p>
          <div className="home-hero-actions">
            <Link className="home-button home-button-primary" to="/slots">
              Đặt lịch chăm sóc <i className="bi bi-calendar2-check" aria-hidden="true" />
            </Link>
            <Link className="home-button home-button-white" to={servicesPath}>
              Khám phá dịch vụ <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </div>
          <span className="home-hero-note">
            <i className="bi bi-heart" aria-hidden="true" /> Xem dịch vụ tự do · Đăng nhập để đặt lịch
          </span>
        </div>
        <div className="home-hero-visual">
          <img src={treatmentPhoto} alt="Chuyên viên chăm sóc da tại Seoul Center" />
          <div className="home-image-note">
            <span className="home-note-icon"><i className="bi bi-flower1" aria-hidden="true" /></span>
            <span>
              <strong>Chăm sóc từ sự lắng nghe</strong>
              <small>Một trải nghiệm dành riêng cho bạn.</small>
            </span>
          </div>
        </div>
      </div>
    </section>

    <section className="home-features home-container" aria-label="Điểm nổi bật">
      {features.map((feature) => (
        <article className="home-feature-card" key={feature.title}>
          <span className="home-feature-icon">
            <i className={`bi ${feature.icon}`} aria-hidden="true" />
          </span>
          <span>
            <strong>{feature.title}</strong>
            <small>{feature.text}</small>
          </span>
        </article>
      ))}
    </section>

    <section className="home-services">
      <div className="home-container">
        <div className="home-section-heading home-section-heading-left">
          <div>
            <span className="home-eyebrow">CHỌN ĐIỀU BẠN CẦN</span>
            <h2>Chăm chút vẻ đẹp, nuôi dưỡng cảm xúc</h2>
            <p>Từ làn da đến mái tóc, mỗi trải nghiệm chăm sóc đều dành cho mình.</p>
          </div>
          <Link className="home-text-link" to={servicesPath}>
            Tất cả dịch vụ <i className="bi bi-arrow-right" aria-hidden="true" />
          </Link>
        </div>
        <div className="home-service-grid">
          {services.map((service) => (
            <article className="home-service-card" key={service.title}>
              <img src={service.image} alt="" />
              <div className="home-service-content">
                <span className="home-eyebrow">{service.category}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <Link to={servicesPath} aria-label={`Tìm hiểu ${service.title}`}>
                  Tìm hiểu dịch vụ <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="home-caption">
          Chi phí và thời lượng được tư vấn theo dịch vụ bạn chọn trước khi xác
          nhận lịch hẹn.
        </p>
      </div>
    </section>

    <section className="home-welcome">
      <div className="home-container home-welcome-grid">
        <div className="home-welcome-image">
          <img src={spaPhoto} alt="Không gian thư giãn tại Seoul Center" />
          <span><i className="bi bi-flower1" aria-hidden="true" /> Không gian thư giãn · Hình ảnh minh họa</span>
        </div>
        <div className="home-welcome-copy">
          <span className="home-eyebrow">CHÀO MỪNG ĐẾN SEOUL CENTER</span>
          <h2>Bước vào nhẹ nhàng.<br />Rời đi với một nụ cười.</h2>
          <p>
            Không chỉ là một buổi chăm sóc, đây còn là thời gian để bạn nghỉ
            ngơi và kết nối lại với chính mình.
          </p>
          <ul>
            <li><i className="bi bi-check-circle" aria-hidden="true" /> Trao đổi mong muốn trước khi bắt đầu</li>
            <li><i className="bi bi-check-circle" aria-hidden="true" /> Lựa chọn dịch vụ theo nhu cầu của bạn</li>
            <li><i className="bi bi-check-circle" aria-hidden="true" /> Hướng dẫn chăm sóc sau buổi trải nghiệm</li>
          </ul>
          <Link className="home-button home-button-white" to={servicesPath}>
            Khám phá dịch vụ <i className="bi bi-arrow-up-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>

    <section className="home-steps">
      <div className="home-container">
        <div className="home-section-heading home-section-heading-center">
          <span className="home-eyebrow">ĐẶT LỊCH THẬT DỄ</span>
          <h2>Một lịch hẹn, chỉ ba bước</h2>
          <p>Khám phá dịch vụ, đăng nhập và chọn thời gian phù hợp.</p>
        </div>
        <div className="home-step-grid">
          {steps.map((step) => (
            <article className="home-step" key={step.number}>
              <div className="home-step-top">
                <span>{step.number}</span>
                <i className={`bi ${step.icon}`} aria-hidden="true" />
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <Link className="home-button home-button-primary home-steps-cta" to="/slots">
          Đặt lịch ngay <i className="bi bi-calendar2-check" aria-hidden="true" />
        </Link>
      </div>
    </section>

    <section className="home-testimonials">
      <div className="home-container">
        <div className="home-section-heading home-section-heading-center">
          <span className="home-eyebrow">NHỮNG CÂU CHUYỆN NHỎ</span>
          <h2>Điều đọng lại sau mỗi lần chăm sóc</h2>
        </div>
        <div className="home-testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="home-testimonial-card" key={testimonial.initials}>
              <i className="bi bi-quote home-quote-icon" aria-hidden="true" />
              <p>{testimonial.quote}</p>
              <div className="home-reviewer">
                <span>{testimonial.initials}</span>
                <span><strong>{testimonial.name}</strong><small>{testimonial.service}</small></span>
              </div>
            </article>
          ))}
        </div>
        <p className="home-caption text-center">Phản hồi minh họa · Nội dung thực tế phụ thuộc trải nghiệm của khách hàng.</p>
        <div className="text-center"><Link className="home-text-link" to={user?.role === "Customer" ? "/feedback" : "/guest/feedback"}>Xem đánh giá khách hàng <i className="bi bi-arrow-right" aria-hidden="true" /></Link></div>
      </div>
    </section>

    <section className="home-faq">
      <div className="home-container home-faq-grid">
        <div className="home-faq-intro">
          <span className="home-eyebrow">GIẢI ĐÁP CÙNG BẠN</span>
          <h2>Một vài điều<br />bạn muốn biết</h2>
          <p>Để bạn nhẹ nhàng bắt đầu trên nền thoải mái và dễ dàng hơn.</p>
          <div className="home-contact-card">
            <strong>Bạn vẫn còn băn khoăn?</strong>
            <span>Chúng tôi sẵn sàng lắng nghe và tư vấn.</span>
            <a href="tel:+84914269346"><i className="bi bi-telephone" aria-hidden="true" /> (+84) 914 269 346</a>
          </div>
        </div>
        <div className="home-faq-list">
          {questions.map((item, index) => (
            <div className={`home-faq-item${activeQuestion === index ? " is-open" : ""}`} key={item.question}>
              <h3>
                <button
                  type="button"
                  aria-expanded={activeQuestion === index}
                  onClick={() => setActiveQuestion(activeQuestion === index ? -1 : index)}
                >
                  {item.question}
                  <i className={`bi bi-${activeQuestion === index ? "dash" : "plus"}`} aria-hidden="true" />
                </button>
              </h3>
              {activeQuestion === index && <p>{item.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="home-contact">
      <div className="home-container home-contact-grid">
        <div>
          <span className="home-eyebrow">HẸN GẶP BẠN TẠI CẦN THƠ</span>
          <h2>Một nơi để bạn chăm sóc mình</h2>
          <div className="home-contact-details">
            <span><i className="bi bi-geo-alt" aria-hidden="true" /><span><small>Địa chỉ</small>329 Nguyễn Văn Cừ, Phường Cái Khế, Thành Phố Cần Thơ</span></span>
            <span><i className="bi bi-clock" aria-hidden="true" /><span><small>Giờ làm việc</small>08:30–18:30 hằng ngày</span></span>
            <span><i className="bi bi-telephone" aria-hidden="true" /><span><small>Điện thoại</small>(+84) 914 269 346</span></span>
            <span><i className="bi bi-envelope" aria-hidden="true" /><span><small>Email</small>cskh@seoulcenter.vn</span></span>
          </div>
          <a className="home-text-link" href="https://maps.google.com/?q=329+Nguyen+Van+Cu+Can+Tho" target="_blank" rel="noreferrer">
            Xem chỉ đường <i className="bi bi-arrow-up-right" aria-hidden="true" />
          </a>
        </div>
        <article className="home-contact-card-large">
          <img src={relaxPhoto} alt="Trải nghiệm thư giãn tại Seoul Center" />
          <div>
            <h3>Hôm nay, ưu tiên bản thân nhé.</h3>
            <p>Chọn một dịch vụ bạn yêu thích. Seoul Center sẽ liên hệ để tư vấn và xác nhận thời gian phù hợp.</p>
            <Link className="home-button home-button-primary" to="/slots">
              Đặt lịch chăm sóc <i className="bi bi-calendar2-check" aria-hidden="true" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  </div>
  );
};

export default GuestHome;
