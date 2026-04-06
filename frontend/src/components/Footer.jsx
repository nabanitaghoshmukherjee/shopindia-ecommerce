import { Link } from 'react-router-dom'

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer>
      <div className="back-to-top" onClick={scrollToTop}>Back to top</div>
      <div className="footer-mobile">
        <div className="footer-mobile-section">
          <h3>Get to Know Us</h3>
          <Link to="#">About Us</Link>
          <Link to="#">Careers</Link>
          <Link to="#">Press Releases</Link>
        </div>
        <div className="footer-mobile-section">
          <h3>Connect with Us</h3>
          <Link to="#">Facebook</Link>
          <Link to="#">Twitter</Link>
          <Link to="#">Instagram</Link>
        </div>
        <div className="footer-mobile-section">
          <h3>Make Money with Us</h3>
          <Link to="#">Sell on ShopIndia</Link>
          <Link to="#">Become an Affiliate</Link>
          <Link to="#">Advertise Your Products</Link>
        </div>
        <div className="footer-mobile-section">
          <h3>Let Us Help You</h3>
          <Link to="#">Your Account</Link>
          <Link to="#">Returns Centre</Link>
          <Link to="#">100% Purchase Protection</Link>
          <Link to="#">Help</Link>
        </div>
      </div>
      <div className="footer-mobile-bottom">
        &copy; 2024-2026 ShopIndia.com, Inc. or its affiliates
      </div>
    </footer>
  )
}

export default Footer
