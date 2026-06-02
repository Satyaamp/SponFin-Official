require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Service = require('../models/Service');
const Project = require('../models/Project');
const Blog = require('../models/Blog');

const seedData = async () => {
  try {
    // Connect to DB
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/sponfin';
    console.log('Connecting to database for seeding...');
    await mongoose.connect(connStr);
    console.log('Connected to MongoDB.');

    // 1. Seed Super Admin User
    const adminEmail = 'admin@sponfin.com';
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      const roleFromDate = new Date();
      adminUser = await User.create({
        name: 'SponFin Super Admin',
        email: adminEmail,
        password: 'AdminPassword123!',
        role: 'super_admin',
        roleFromDate,
        isActive: true
      });
      
      const RoleHistory = require('../models/RoleHistory');
      await RoleHistory.create({
        userId: adminUser._id,
        userName: adminUser.name,
        role: 'super_admin',
        fromDate: roleFromDate,
        toDate: null,
        changedBy: 'System Seeding'
      });
      console.log(`Super Admin user created successfully. Email: ${adminEmail}, Password: AdminPassword123!`);
    } else {
      console.log('Super Admin user already exists. Skipping user seed.');
    }

    // 2. Seed Default Settings
    let settings = await Setting.findOne();
    if (!settings) {
      console.log('Seeding default settings...');
      settings = await Setting.create({
        companyName: 'SponFin',
        companyDescription: 'Dynamic Financial Consultancy & Brand Sponsorship Platform',
        address: '100 Financial Way, Suite 400, New York, NY 10001',
        phone: '+1 (555) 123-4567',
        email: 'contact@sponfin.com',
        socialLinks: {
          facebook: 'https://facebook.com/sponfin',
          twitter: 'https://twitter.com/sponfin',
          linkedin: 'https://linkedin.com/company/sponfin',
          instagram: 'https://instagram.com/sponfin'
        },
        heroContent: {
          title: 'Accelerate Brand Value via Strategic Sponsorships',
          subtitle: 'We pair high-performing financial firms with premium sports, arts, and digital assets using AI-driven matching metrics.',
          buttonText: 'Schedule Consultation',
          buttonLink: '#contact',
          imageUrl: '',
          publicId: ''
        },
        aboutContent: {
          title: 'Innovative Partnerships. Smarter Finances.',
          text: 'SponFin bridges the gap between premium sponsors and high-growth projects. By employing real-time matching algorithms, detailed brand performance analysis, and end-to-end activation support, we turn sponsorship from an expense into an investment.',
          imageUrl: '',
          publicId: ''
        }
      });
      console.log('Settings seeded successfully.');
    } else {
      console.log('Settings already exist. Skipping settings seed.');
    }

    // 3. Seed Services if empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log('Seeding initial services...');
      await Service.create([
        {
          title: 'Sponsorship Brokerage',
          shortDescription: 'AI-assisted pairing of corporate sponsors with leading brand properties.',
          description: 'Our proprietary algorithm analyzes demographic alignment, brand affinity, and past engagement data to ensure your sponsorships deliver maximum ROI. We manage the pipeline from cold outreach to final contract signature.',
          imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
          publicId: 'sponfin_default_service_1',
          displayOrder: 1,
          isActive: true
        },
        {
          title: 'Audience Demographics Analytics',
          shortDescription: 'Deep visual analytics showing exactly who interacts with your brand campaigns.',
          description: 'Leveraging data scrapers and statistical models, we generate detailed insights on age distribution, geographic reach, purchase intent, and brand sentiment. Track performance through a real-time web portal.',
          imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
          publicId: 'sponfin_default_service_2',
          displayOrder: 2,
          isActive: true
        },
        {
          title: 'Digital Campaign Activation',
          shortDescription: 'Bespoke marketing activations across mobile, web, and live event channels.',
          description: 'We design and coordinate full-funnel digital experiences to launch sponsorships. From customized landing pages to social media amplification and live physical activations, we handle the creative details.',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
          publicId: 'sponfin_default_service_3',
          displayOrder: 3,
          isActive: true
        }
      ]);
      console.log('Services seeded successfully.');
    } else {
      console.log('Services already exist. Skipping services seed.');
    }

    // 4. Seed Projects if empty
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      console.log('Seeding initial projects...');
      await Project.create([
        {
          title: 'Apex Financial Platform',
          category: 'Website',
          description: 'A complete corporate web solution featuring interactive dashboards, service portfolios, and integrated lead generation funnels for a top-tier asset manager.',
          technologies: ['Node.js', 'Express', 'MongoDB', 'Vanilla JS', 'CSS3 Grid'],
          images: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
              publicId: 'sponfin_default_proj_1'
            }
          ],
          projectUrl: 'https://apex-demo.example.com',
          featured: true
        },
        {
          title: 'SponsorHub Mobile App',
          category: 'Mobile App',
          description: 'Cross-platform mobile application that allows sport event organizers to upload sponsorship inventory and message interested corporate sponsors directly.',
          technologies: ['React Native', 'Node.js', 'WebSockets', 'MongoDB'],
          images: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
              publicId: 'sponfin_default_proj_2'
            }
          ],
          projectUrl: '',
          featured: true
        },
        {
          title: 'Velociti Marketing Campaign',
          category: 'Marketing',
          description: 'A global digital marketing campaign for an electric vehicle company, activating sponsorships across Formula E races, influencer campaigns, and dynamic landing pages.',
          technologies: ['Instagram API', 'Google Ads', 'CSS3 Keyframes', 'Dynamic Analytics'],
          images: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
              publicId: 'sponfin_default_proj_3'
            }
          ],
          projectUrl: 'https://velociti-campaign.example.com',
          featured: false
        }
      ]);
      console.log('Projects seeded successfully.');
    } else {
      console.log('Projects already exist. Skipping projects seed.');
    }

    // 5. Seed Blogs if empty
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      console.log('Seeding initial blogs...');
      await Blog.create([
        {
          title: 'The Future of Fintech Sponsorships',
          seoTitle: 'Future of Fintech Sponsorships and Sports Marketing | SponFin',
          metaDescription: 'Discover how fintech companies are leveraging sports and entertainment sponsorships to drive user growth, brand equity, and premium trust in 2026.',
          tags: ['Fintech', 'Sponsorship', 'Marketing Strategy', 'ROI'],
          featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
          publicId: 'sponfin_default_blog_1',
          content: '<h2>Why Sponsorship Matters</h2><p>Sponsorship is transitioning rapidly from simple logo placements to integrated brand activations. Fintech brands are especially leading this shift, aligning with popular sports and esports venues to build trust and immediate brand utility.</p><h3>AI-Driven Matching</h3><p>By leveraging user demographic data, digital platforms can now predict sponsorship ROI with higher confidence before signing contracts.</p>',
          status: 'published',
          author: adminUser._id
        },
        {
          title: 'Draft: Marketing Budgets in Post-Pandemic Economy',
          seoTitle: 'How to Optimize Marketing Budgets | SponFin',
          metaDescription: 'A draft planning guide discussing budget allocations between digital advertising and corporate partnership activations.',
          tags: ['Budgets', 'Marketing', 'Planning'],
          featuredImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          publicId: 'sponfin_default_blog_2',
          content: '<p>Draft contents regarding marketing budgets and capital distribution. This should remain hidden from public blog readers until published by the editor.</p>',
          status: 'draft',
          author: adminUser._id
        }
      ]);
      console.log('Blogs seeded successfully.');
    } else {
      console.log('Blogs already exist. Skipping blogs seed.');
    }

    // 6. Seed Subscription Plans if empty
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const planCount = await SubscriptionPlan.countDocuments();
    if (planCount === 0) {
      console.log('Seeding initial subscription plans...');
      await SubscriptionPlan.create([
        {
          title: 'Growth Plan',
          price: '₹10,000 (One-Time Payment)',
          description: 'Ideal For: Businesses that want to improve their online visibility and attract more potential customers.',
          features: 'Digital presence improvement\nBasic business profile optimization\nSocial media growth support\nLead-generation focused campaigns\nBrand visibility enhancement\nConsultation and growth recommendations',
          objective: 'Objective: Help businesses strengthen their online presence and create more opportunities for customer acquisition.',
          displayOrder: 1,
          isActive: true
        },
        {
          title: 'Business Growth Plan',
          price: '₹50,000 (One-Time Payment)',
          description: 'Ideal For: Businesses that need a professional website along with digital growth support.',
          features: 'Professional business website\nMobile-responsive design\nModern user interface\nSEO-friendly website structure\nDigital marketing support\nOnline presence management\nLead generation strategy\nBasic analytics integration',
          objective: 'Objective: Establish a strong digital foundation and improve customer trust through a professional online presence.',
          displayOrder: 2,
          isActive: true
        },
        {
          title: 'Premium Brand Plan',
          price: '₹1,00,000 (One-Time Payment)',
          description: 'Ideal For: Businesses looking for a complete digital ecosystem.',
          features: 'Professional website development\nCustom mobile application\nDigital marketing services\nOnline branding support\nGrowth-focused strategy implementation\nEnhanced customer engagement systems\nBusiness consultation and digital planning',
          objective: 'Objective: Transform your business into a scalable digital brand with both web and mobile presence.',
          displayOrder: 3,
          isActive: true
        },
        {
          title: 'Enterprise Growth Plan',
          price: 'Custom Pricing',
          description: 'Ideal For: Businesses seeking large-scale digital expansion and brand growth.',
          features: 'Professional website\nMobile application\nDigital marketing services\nInfluencer marketing campaigns\nAdvanced branding strategy\nCustomized growth roadmap\nDedicated planning and consultation',
          objective: 'Pricing Note: The final cost depends on project scope, campaign requirements, and influencer collaboration fees.',
          displayOrder: 4,
          isActive: true
        },
        {
          title: 'Maintenance & Support Policy',
          price: '₹4,000/month',
          description: 'All subscription plans above are one-time payments for the initial development and service scope.',
          features: 'Technical support\nBug fixes\nPerformance monitoring\nSecurity updates\nRoutine maintenance',
          objective: 'Important: If new features, major functionality upgrades, or additional development work are requested, the cost will be quoted separately based on project requirements.',
          displayOrder: 5,
          isActive: true
        }
      ]);
      console.log('Subscription plans seeded successfully.');
    } else {
      console.log('Subscription plans already exist. Skipping subscription plans seed.');
    }

    // 7. Seed Default Permissions
    const Permission = require('../models/Permission');
    const permissionCount = await Permission.countDocuments();
    if (permissionCount === 0) {
      console.log('Seeding initial role permissions...');
      await Permission.create([
        {
          role: 'super_admin',
          services: { create: true, read: true, update: true, delete: true },
          projects: { create: true, read: true, update: true, delete: true },
          blogs: { create: true, read: true, update: true, delete: true },
          leads: { create: false, read: true, update: true, delete: true },
          subscriptionRequests: { create: false, read: true, update: true, delete: true },
          subscriptions: { create: true, read: true, update: true, delete: true },
          settings: { create: false, read: true, update: true, delete: false },
          users: { create: true, read: true, update: true, delete: true }
        },
        {
          role: 'admin',
          services: { create: true, read: true, update: true, delete: true },
          projects: { create: true, read: true, update: true, delete: true },
          blogs: { create: true, read: true, update: true, delete: true },
          leads: { create: false, read: true, update: true, delete: true },
          subscriptionRequests: { create: false, read: true, update: true, delete: true },
          subscriptions: { create: true, read: true, update: true, delete: true },
          settings: { create: false, read: true, update: true, delete: false },
          users: { create: false, read: true, update: true, delete: false }
        },
        {
          role: 'editor',
          services: { create: true, read: true, update: true, delete: false },
          projects: { create: true, read: true, update: true, delete: false },
          blogs: { create: true, read: true, update: true, delete: false },
          leads: { create: false, read: true, update: true, delete: false },
          subscriptionRequests: { create: false, read: true, update: true, delete: false },
          subscriptions: { create: true, read: true, update: true, delete: false },
          settings: { create: false, read: true, update: true, delete: false },
          users: { create: false, read: false, update: true, delete: false }
        }
      ]);
      console.log('Role permissions seeded successfully.');
    } else {
      console.log('Role permissions already exist. Skipping permissions seed.');
    }

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

seedData();
