# ShopIndia E-Commerce - Licensing & Legal

## Can You Sell This Software?

**YES** - You can sell this software to anyone. Here's what you need to know:

---

## What You OWN

- ✅ Complete source code
- ✅ All backend files (server-pg.js, server.js)
- ✅ All frontend files (React components)
- ✅ Database schema (shopindia.sql)
- ✅ Configuration files (.env template)
- ✅ Documentation (LOCAL_SETUP.md)

## What You Can Do

| Action | Allowed? |
|--------|----------|
| Sell the software | ✅ YES |
| Modify the code | ✅ YES |
| Use for commercial purposes | ✅ YES |
| Deploy on your own servers | ✅ YES |
| Offer as a service (SaaS) | ✅ YES |
| Resell to multiple clients | ✅ YES |

---

## Important: Third-Party Licenses

This project uses open-source packages. Here's what you need to know:

### Dependencies & Their Licenses

| Package | License | Commercial Use |
|---------|---------|----------------|
| Express.js | MIT | ✅ Free |
| React | MIT | ✅ Free |
| PostgreSQL | PostgreSQL | ✅ Free |
| JWT | MIT | ✅ Free |
| Razorpay SDK | MIT | ⚠️ Requires account |
| Multer | MIT | ✅ Free |
| pg | MIT | ✅ Free |
| xlsx | Apache 2.0 | ✅ Free |
| cors | MIT | ✅ Free |

### Summary
All dependencies are **commercially usable** for your e-commerce platform.

---

## What You Need to Change Before Selling

### 1. ⚠️ SECURITY - Change Secrets
```env
# BEFORE selling, CHANGE these:
JWT_SECRET=your_new_secret_key_here
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 2. ⚠️ Demo User
- Current demo user: `demo@shopindia.com` / `demo123`
- Consider removing or changing before production

### 3. ⚠️ Payment Gateway
- Sign up for **Razorpay** (India) or **Stripe** (International)
- Replace demo keys with real merchant credentials

### 4. ⚠️ Brand Name
- Change "ShopIndia" to your client's brand
- Update logo and colors
- Modify footer/header text

---

## Selling to Clients - Recommendations

### For Each Client, You Should:
1. **Set up their own database** - Don't share data between clients
2. **Customize the branding** - Change logo, colors, name
3. **Use their payment account** - Client gets paid to their account
4. **Host on their infrastructure** OR charge monthly hosting fee
5. **Provide support** - Consider a maintenance contract

### Pricing Models
- **One-time license**: Sell the code once (your choice)
- **SaaS subscription**: Host for them, charge monthly
- **White-label**: Full rebrand, they own it completely

---

## What You CANNOT Do

- ❌ Claim other people's work as your own (Unsplash images)
- ❌ Use this exact code without understanding it
- ❌ Skip security updates and blame others

---

## Technical Notes

### Unsplash Images
Product images use Unsplash (free license). For commercial use:
- Images can be used commercially
- No attribution required
- Consider hosting your own images for consistency

### Data Privacy
- If collecting user data, comply with GDPR/Indian IT laws
- Implement proper password hashing in production
- Use HTTPS in production

---

## Recommended Production Changes

Before selling/deploying:

```javascript
// 1. Add password hashing (bcrypt)
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// 2. Add HTTPS (use Nginx/Apache in production)

// 3. Add rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));

// 4. Add input validation
const Joi = require('joi');

// 5. Use environment variables (already set up with dotenv)
```

---

## Need Custom Development?

If you need additional features:
- Payment gateway integration
- Admin dashboard enhancements
- Inventory management
- Multi-vendor support
- Mobile app

Contact a developer or hire based on this codebase.

---

## Quick Start Checklist

Before selling to a client:

- [ ] Change all default passwords
- [ ] Set up new Razorpay/Stripe account for client
- [ ] Customize branding (name, logo, colors)
- [ ] Set up hosting (Vercel, AWS, DigitalOcean)
- [ ] Configure domain name
- [ ] Set up SSL certificate
- [ ] Test all functionality
- [ ] Create client documentation
- [ ] Set up support system

---

**Questions?** The code is yours to use and modify as needed.
