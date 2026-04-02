import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Get to Know Us</h3>
          <ul>
            <li><Link to="#">About Us</Link></li>
            <li><Link to="#">Careers</Link></li>
            <li><Link to="#">Press Releases</Link></li>
            <li><Link to="#">ShopIndia Science</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Connect with Us</h3>
          <ul>
            <li><Link to="#">Facebook</Link></li>
            <li><Link to="#">Twitter</Link></li>
            <li><Link to="#">Instagram</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Make Money with Us</h3>
          <ul>
            <li><Link to="#">Sell on ShopIndia</Link></li>
            <li><Link to="#">Protect and Build Your Brand</Link></li>
            <li><Link to="#">Global Selling</Link></li>
            <li><Link to="#">Become an Affiliate</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Let Us Help You</h3>
          <ul>
            <li><Link to="#">COVID-19 and ShopIndia</Link></li>
            <li><Link to="#">Your Account</Link></li>
            <li><Link to="#">Returns Centre</Link></li>
            <li><Link to="#">Help</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2024-2026 ShopIndia.com, Inc. or its affiliates</p>
      </div>
    </footer>
  )
}

export default Footer
