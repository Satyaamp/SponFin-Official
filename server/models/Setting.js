const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    default: 'SponFin'
  },
  companyDescription: {
    type: String,
    default: 'Dynamic Business Solutions and Financial Consulting'
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: 'contact@sponfin.com'
  },
  logo: {
    imageUrl: {
      type: String,
      default: '/client/assets/logo.png' // Fallback path if none uploaded
    },
    publicId: {
      type: String,
      default: 'sponfin_default_logo'
    }
  },
  socialLinks: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },
  heroContent: {
    title: { type: String, default: 'Empower Your Brand with Financial Growth' },
    subtitle: { type: String, default: 'We offer specialized sponsorship matching, analytics, and marketing solutions.' },
    buttonText: { type: String, default: 'Get Started' },
    buttonLink: { type: String, default: '#contact' },
    imageUrl: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  aboutContent: {
    title: { type: String, default: 'About SponFin' },
    text: { type: String, default: 'SponFin is a pioneer in digital sponsorship matching and high-end marketing campaigns, supporting companies globally with dynamic analytics and web/mobile integrations.' },
    imageUrl: { type: String, default: '' },
    publicId: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
