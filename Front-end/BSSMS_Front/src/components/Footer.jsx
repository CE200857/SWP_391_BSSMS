import { Link } from "react-router-dom";
import SeoulBrand from "./SeoulBrand";
import { SITE } from "../siteConfig";

const SOCIALS = [
  { key: "facebook", label: "Facebook", url: SITE.facebookUrl, icon: "bi bi-facebook" },
  { key: "instagram", label: "Instagram", url: SITE.instagramUrl, icon: "bi bi-instagram" },
  { key: "zalo", label: "Zalo", url: SITE.zaloUrl, text: "Zalo" },
].filter((item) => item.url);

const Footer = ({ user }) => (
  <footer className="app-footer">
    <div className="app-footer-inner">
      <div className="app-footer-brand">
        <SeoulBrand inverse />
        <p>
          Caring for beauty. Valuing feelings. Accompanying you through moments
          you give to yourself.
        </p>
        <div className="app-footer-socials" aria-label="Social media">
          {SOCIALS.map((item) => (
            <a key={item.key} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`${item.label} of ${SITE.name}`}>
              {item.icon ? <i className={item.icon} aria-hidden="true" /> : item.text}
            </a>
          ))}
        </div>
      </div>

      <div className="app-footer-column">
        <h2>Explore</h2>
        <Link to={user?.role === "Customer" ? "/services" : "/guest/services"}>Services</Link>
        <Link to={user?.role === "Customer" ? "/customer/home" : "/bssms-guest"}>About Seoul Center</Link>
        <Link to={user?.role === "Customer" ? "/feedback" : "/guest/feedback"}>Reviews</Link>
        <Link to="/slots">Book an appointment</Link>
      </div>

      <div className="app-footer-column">
        <h2>Customer support</h2>
        <Link to="/faq">Frequently asked questions</Link>
        <Link to="/privacy">Privacy policy</Link>
        <Link to="/terms">Terms of use</Link>
        {!user && <Link to="/login">Log in</Link>}
      </div>

      <div className="app-footer-column app-footer-location">
        <h2>Seoul Center · Can Tho</h2>
        <p>{SITE.address}</p>
        <a href={`tel:${SITE.phoneLink}`}>{SITE.phoneDisplay}</a>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        <p>{SITE.hours}</p>
      </div>
    </div>
    <div className="app-footer-bottom">
      <span>© {new Date().getFullYear()} Seoul Center. All rights reserved.</span>
      <span>A little care goes a long way.</span>
    </div>
  </footer>
);

export default Footer;
