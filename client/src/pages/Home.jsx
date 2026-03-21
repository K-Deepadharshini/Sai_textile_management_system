import React, { useState, useEffect } from 'react';
import PublicNavbar from '../components/common/PublicNavbar';
import { useAuth } from '../context/AuthContext';
import messageService from '../services/messageService';
import toast from 'react-hot-toast';
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

  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Hello! I am your Textile Assistant. Ask me anything about products, pricing, orders or support.' }
  ]);
  const [isSending, setIsSending] = useState(false);

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

  const getBotReply = (message) => {
    const q = message.toLowerCase();

    if (q.includes('what products') || q.includes('products do you offer')) {
      return 'We offer a wide range of textile products including:\n• Polyester Filament Yarn (150D, 120D)\n• Yarn Dyed Fabric\n• Raw Yarn Material\n• Specialty Raw Yarn\n\nAll products are manufactured with premium quality standards. You can browse our full catalog by logging in to your account.';
    }

    if (q.includes('how do i place') || q.includes('place an order')) {
      return 'To place an order:\n1. Register/Login to your account\n2. Browse our available products\n3. Select the product and quantity\n4. Add to cart and proceed to checkout\n5. Provide delivery details and payment information\n\nOur team will confirm your order within 24 hours.';
    }

    if (q.includes('delivery times') || q.includes('how long') || q.includes('shipping time')) {
      return 'Our standard delivery times:\n• Within India: 7-12 working days\n• International: 15-25 working days\n\nUrgent orders can be expedited. Contact us for express delivery options. All shipments include tracking information.';
    }

    if (q.includes('return policy') || q.includes('returns') || q.includes('refund')) {
      return 'Our return policy:\n• Returns accepted within 10 business days\n• Products must be in original condition\n• Return shipping costs may apply\n• Refunds processed within 5-7 business days\n\nPlease contact support with your order number for return assistance.';
    }

    if (q.includes('contact support') || q.includes('how can i contact') || q.includes('support')) {
      return 'You can contact our support team through:\n• This chatbot (messages sent to admin)\n• Email: info@saitextile.com\n• Phone: +91 XXXX XXXX XX\n• Login to your account and use the Messages section\n\nOur support hours: Monday-Saturday, 9 AM - 6 PM IST';
    }

    if (q.includes('price') || q.includes('cost') || q.includes('pricing')) {
      return 'Our prices depend on:\n• Product type and specifications\n• Order quantity (bulk discounts available)\n• Material quality requirements\n\nPlease share your specific requirements for a personalized quote. Minimum order quantities apply for certain products.';
    }

    if (q.includes('delivery') || q.includes('shipping') || q.includes('lead time')) {
      return 'Delivery typically takes 7-12 working days for domestic orders. International shipping takes 15-25 working days. We provide real-time tracking for all shipments. Express delivery options are available for urgent requirements.';
    }

    if (q.includes('order') || q.includes('status')) {
      return 'To check your order status:\n1. Login to your account\n2. Go to Orders section\n3. View order details and current status\n\nFor any issues, contact support with your order number. We provide regular updates on order progress.';
    }

    return 'Thanks for your question! I\'m here to help with information about our products, ordering process, pricing, delivery, and support. You can also click on the common questions above or ask me anything specific about our textile manufacturing services.';
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { from: 'user', text: userText }]);
    setChatInput('');

    const botText = getBotReply(userText);
    setChatMessages((prev) => [...prev, { from: 'bot', text: botText }]);

    if (user && user.role === 'client') {
      setIsSending(true);
      try {
        await messageService.sendMessage({
          receiver: 'admin',
          subject: 'Customer chatbot query',
          message: userText,
          category: 'customer-support'
        });
        toast.success('Your query has been sent to support.');
      } catch (err) {
        console.error('Chat message send error:', err);
        toast.error('Failed to send query to support.');
      } finally {
        setIsSending(false);
      }
    }
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

      {/* AI Chatbot */}
      <div style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 9999 }}>
        <button
          onClick={() => setChatOpen((open) => !open)}
          style={{
            background: '#0066cc',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '999px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
        >
          {chatOpen ? 'Close Chat' : 'Chat with AI Support'}
        </button>

        {chatOpen && (
          <div style={{
            width: '320px',
            maxHeight: '480px',
            marginTop: '0.75rem',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', background: '#f7f7f7', fontWeight: 'bold' }}>
              Textile AI Chatbot
            </div>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #eee', background: '#fafafa' }}>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Common Questions:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {[
                  'What products do you offer?',
                  'How do I place an order?',
                  'What are your delivery times?',
                  'What is your return policy?',
                  'How can I contact support?'
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setChatInput(question)}
                    style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      border: '1px solid #bbdefb',
                      borderRadius: '16px',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#bbdefb'}
                    onMouseOut={(e) => e.target.style.background = '#e3f2fd'}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, padding: '0.75rem', overflowY: 'auto', background: '#fafafa' }}>
              {chatMessages.map((msg, index) => (
                <div key={index} style={{ marginBottom: '0.5rem', textAlign: msg.from === 'user' ? 'right' : 'left' }}>
                  <div style={{
                    display: 'inline-block',
                    background: msg.from === 'user' ? '#d8eafd' : '#e0e0e0',
                    color: '#111',
                    borderRadius: '12px',
                    padding: '0.5rem 0.75rem',
                    maxWidth: '85%'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage();
              }}
              style={{ borderTop: '1px solid #ddd', display: 'flex', padding: '0.5rem', gap: '0.5rem' }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about pricing, orders, etc."
                style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px', padding: '0.5rem' }}
              />
              <button type="submit" disabled={isSending || !chatInput.trim()} style={{ background: '#0066cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', cursor: 'pointer' }}>
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>

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
