import React, { useState, useEffect } from 'react';
import PublicNavbar from '../components/common/PublicNavbar';
import { FaLeaf, FaClock, FaShieldAlt, FaTruck, FaStar } from 'react-icons/fa';
import image1 from '../../image1.png';
import image2 from '../../image2.png';
import image3 from '../../image3.png';
import image4 from '../../image4.png';
import image5 from '../../image5.png';
import image6 from '../../image6.png';
import image7 from '../../image7.png';
import image8 from '../../image8.png';
import image01 from '../../image01.png';
import image02 from '../../image02.png';
import image03 from '../../image03.png';
import image04 from '../../image04.png';
import image05 from '../../image05.png';
import image06 from '../../image06.png';
import './styles/Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products from API
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.slice(0, 6)); // Show first 6 products
        } else {
          // Set default sample products if API fails
          setSampleProducts();
        }
      } catch (error) {
        setSampleProducts();
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const setSampleProducts = () => {
    const sampleData = [
      {
        _id: '1',
        name: 'Polyester Filament Yarn',
        type: 'polyester-filament',
        denier: '150D',
        specifications: { twist: '3', luster: 'Bright', tenacity: '4.5' },
        price: 450,
        image: image01,
      },
      {
        _id: '2',
        name: 'Yarn Dyed Fabric',
        type: 'yarn-dyed',
        denier: '100D',
        specifications: { twist: '2.5', luster: 'Matt', tenacity: '4.2' },
        price: 550,
        image: image02,
      },
      {
        _id: '3',
        name: 'Raw Yarn Material',
        type: 'raw-yarn',
        denier: '200D',
        specifications: { twist: '4', luster: 'Semi-dull', tenacity: '5.0' },
        price: 380,
        image: image03,
      },
      {
        _id: '4',
        name: 'Premium Filament Yarn',
        type: 'polyester-filament',
        denier: '120D',
        specifications: { twist: '3.5', luster: 'Bright', tenacity: '4.8' },
        price: 520,
        image: image04,
      },
      {
        _id: '5',
        name: 'Color Dyed Yarn',
        type: 'yarn-dyed',
        denier: '80D',
        specifications: { twist: '2', luster: 'Matt', tenacity: '4.0' },
        price: 480,
        image: image05,
      },
      {
        _id: '6',
        name: 'Specialty Raw Yarn',
        type: 'raw-yarn',
        denier: '250D',
        specifications: { twist: '4.5', luster: 'Bright', tenacity: '5.5' },
        price: 420,
        image: image06,
      },
    ];
    setProducts(sampleData);
  };

  return (
    <div className="home-page">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Premium Textile Manufacturing</h1>
          <p>Delivering Excellence in Yarn & Fabric Production</p>
          <div className="hero-buttons">
            <button className="btn btn-primary">Explore Products</button>
            <button className="btn btn-secondary">Contact Us</button>
          </div>
        </div>
        <div className="hero-overlay"></div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="products-section">
        <div className="section-container">
          <h2 className="section-title">Our Manufacturing Products</h2>
          <p className="section-subtitle">
            Premium quality textiles manufactured with precision and excellence
          </p>

          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    <img src={product.image} alt={product.name} className="product-image__img" />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-type">
                      {product.type.replace('-', ' ').toUpperCase()}
                    </p>
                    <div className="product-specs">
                      <span className="spec">
                        <strong>Denier:</strong> {product.denier}
                      </span>
                      <span className="spec">
                        <strong>Twist:</strong> {product.specifications?.twist}
                      </span>
                    </div>
                    <div className="product-footer">
                      <span className="price">₹{product.price}/kg</span>
                      <FaStar className="star" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="about-content">
            <div className="about-text">
              <h2>About Sai Pathirakaliamman Textile</h2>
              <p>
                Sai Pathirakaliamman Textile is a leading manufacturer of high-quality polyester filament yarns, 
                yarn-dyed fabrics, and raw yarn materials. With over two decades of excellence, 
                we serve customers across the globe with premium textile solutions.
              </p>
              <p>
                Our state-of-the-art manufacturing facilities, combined with skilled workforce 
                and advanced technology, enable us to produce textiles that meet international 
                standards and customer specifications.
              </p>

              <div className="features-grid">
                <div className="feature">
                  <FaLeaf className="feature-icon" />
                  <h4>Sustainable</h4>
                  <p>Eco-friendly manufacturing processes</p>
                </div>
                <div className="feature">
                  <FaClock className="feature-icon" />
                  <h4>Timely Delivery</h4>
                  <p>On-time production and delivery</p>
                </div>
                <div className="feature">
                  <FaShieldAlt className="feature-icon" />
                  <h4>Quality Assured</h4>
                  <p>ISO certified quality standards</p>
                </div>
                <div className="feature">
                  <FaTruck className="feature-icon" />
                  <h4>Logistics Support</h4>
                  <p>Nationwide delivery network</p>
                </div>
              </div>
            </div>

            <div className="about-images">
              <div className="image-grid">
                <div className="image-item main-image">
                  <div className="image-placeholder">
                    <span>Manufacturing Facility</span>
                  </div>
                </div>
                <div className="image-item">
                  <div className="image-placeholder">
                    <span>Raw Materials</span>
                  </div>
                </div>
                <div className="image-item">
                  <div className="image-placeholder">
                    <span>Quality Control</span>
                  </div>
                </div>
                <div className="image-item">
                  <div className="image-placeholder">
                    <span>Final Products</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="gallery-section">
        <div className="section-container">
          <h2 className="section-title">Company Gallery</h2>
          <p className="section-subtitle">
            A glimpse into our modern manufacturing facilities and quality products
          </p>

          <div className="gallery-grid">
            {[
              { title: 'Production Line 1', desc: 'State-of-the-art spinning machines', src: image1 },
              { title: 'Quality Testing', desc: 'Advanced testing laboratory', src: image2 },
              { title: 'Packaging', desc: 'Professional packaging facility', src: image3 },
              { title: 'Warehouse', desc: 'Climate-controlled storage', src: image4 },
              { title: 'Team', desc: 'Skilled workforce', src: image5 },
              { title: 'Innovation', desc: 'R&D Department', src: image6 },
              { title: 'Certifications', desc: 'ISO & International Standards', src: image7 },
              { title: 'Client Support', desc: '24/7 Customer Service', src: image8 },
            ].map((item, index) => (
              <div key={index} className="gallery-item">
                <div className="gallery-image">
                  <img src={item.src} alt={item.title} className="gallery-image__img" />
                </div>
                <div className="gallery-caption">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2>Ready to Work With Us?</h2>
          <p>Join thousands of satisfied customers who trust Sai Pathirakaliamman Textile for their needs</p>
          <button className="btn btn-light">Get Started Today</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="section-container">
          <div className="footer-content">
            <div className="footer-column">
              <h4>Sai Pathirakaliamman Textile</h4>
              <p>Premium textile manufacturing excellence</p>
            </div>
            <div className="footer-column">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#products">Products</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#gallery">Gallery</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Contact</h4>
              <p>Email: info@saitextile.com</p>
              <p>Phone: +91 XXXX XXXX XX</p>
            </div>
            <div className="footer-column">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="#facebook">Facebook</a>
                <a href="#twitter">Twitter</a>
                <a href="#linkedin">LinkedIn</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Sai Pathirakaliamman Textile Process. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
