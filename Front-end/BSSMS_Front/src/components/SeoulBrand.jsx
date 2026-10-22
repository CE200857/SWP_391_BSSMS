import flower from "../assets/figma/brand-flower.svg";

const SeoulBrand = ({ inverse = false }) => (
  <span className={`seoul-brand${inverse ? " seoul-brand-inverse" : ""}`}>
    <span className="seoul-brand-mark">
      <img src={flower} alt="" />
    </span>
    <span className="seoul-brand-wordmark">
      <span className="seoul-brand-name">SEOUL</span>
      <span className="seoul-brand-caption">CENTER · SALON &amp; SPA</span>
    </span>
  </span>
);

export default SeoulBrand;
