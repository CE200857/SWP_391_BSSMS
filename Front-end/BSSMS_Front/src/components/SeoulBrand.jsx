import logo from "../images/seoul-center-logo-transparent.png";

const SeoulBrand = ({ inverse = false }) => (
  <span className={`seoul-brand${inverse ? " seoul-brand-inverse" : ""}`}>
    <img className="seoul-brand-image" src={logo} alt="Seoul Center · Salon & Spa" />
  </span>
);

export default SeoulBrand;
