import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding database...')

  // Create comprehensive categories for the platform
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'general' },
      update: {},
      create: {
        name: 'General',
        slug: 'general',
        description: 'General questions and discussions',
        icon: 'HelpCircle',
        color: '#6b7280',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'software' },
      update: {},
      create: {
        name: 'Software',
        slug: 'software',
        description: 'Software development and programming questions',
        icon: 'Code',
        color: '#3b82f6',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'hardware' },
      update: {},
      create: {
        name: 'Hardware',
        slug: 'hardware',
        description: 'Hardware configuration and troubleshooting',
        icon: 'Server',
        color: '#10b981',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'hr' },
      update: {},
      create: {
        name: 'HR',
        slug: 'hr',
        description: 'Human resources and workplace questions',
        icon: 'Users',
        color: '#8b5cf6',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'ap' },
      update: {},
      create: {
        name: 'AP',
        slug: 'ap',
        description: 'Access Point configuration and troubleshooting',
        icon: 'Wifi',
        color: '#ef4444',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'r1' },
      update: {},
      create: {
        name: 'R1',
        slug: 'r1',
        description: 'Ruckus One platform and management',
        icon: 'Settings',
        color: '#f97316',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'cloud' },
      update: {},
      create: {
        name: 'Cloud',
        slug: 'cloud',
        description: 'Cloud services and infrastructure',
        icon: 'Cloud',
        color: '#06b6d4',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'qa' },
      update: {},
      create: {
        name: 'QA',
        slug: 'qa',
        description: 'Quality assurance and testing',
        icon: 'CheckCircle',
        color: '#84cc16',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'scg' },
      update: {},
      create: {
        name: 'SCG',
        slug: 'scg',
        description: 'SmartCell Gateway configuration and management',
        icon: 'Router',
        color: '#a855f7',
      },
    }),
  ])

  console.log('✅ Categories created')

  // Create sample rewards
  const rewards = await Promise.all([
    prisma.reward.upsert({
      where: { id: 'coffee-voucher' },
      update: {},
      create: {
        id: 'coffee-voucher',
        name: 'Coffee Voucher',
        description: 'Free coffee from the office café',
        points: 50,
        category: 'Food & Drink',
        icon: 'Coffee',
        available: 15,
      },
    }),
    prisma.reward.upsert({
      where: { id: 'amazon-gift-card' },
      update: {},
      create: {
        id: 'amazon-gift-card',
        name: 'Amazon Gift Card ($25)',
        description: '$25 Amazon gift card',
        points: 250,
        category: 'Gift Cards',
        icon: 'ShoppingCart',
        available: 8,
      },
    }),
    prisma.reward.upsert({
      where: { id: 'team-lunch' },
      update: {},
      create: {
        id: 'team-lunch',
        name: 'Team Lunch Sponsorship',
        description: 'Sponsor lunch for your team (up to 8 people)',
        points: 500,
        category: 'Team Events',
        icon: 'Gift',
        available: 2,
      },
    }),
    prisma.reward.upsert({
      where: { id: 'parking-spot' },
      update: {},
      create: {
        id: 'parking-spot',
        name: 'Premium Parking Spot',
        description: 'Reserved parking spot for one month',
        points: 300,
        category: 'Perks',
        icon: 'Star',
        available: 4,
      },
    }),
    prisma.reward.upsert({
      where: { id: 'learning-budget' },
      update: {},
      create: {
        id: 'learning-budget',
        name: 'Learning Budget ($100)',
        description: 'Additional learning and development budget',
        points: 400,
        category: 'Professional Development',
        icon: 'Award',
        available: 6,
      },
    }),
    prisma.reward.upsert({
      where: { id: 'company-swag' },
      update: {},
      create: {
        id: 'company-swag',
        name: 'Company Swag Package',
        description: 'Exclusive company merchandise bundle',
        points: 150,
        category: 'Merchandise',
        icon: 'Gift',
        available: 12,
      },
    }),
  ])

  console.log('✅ Rewards created')

  // Create admin user (only if it doesn't exist)
  try {
    const adminUserPassword = await bcrypt.hash('admin@RuckusHub1!', 12)
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@ruckushub.com' },
          { email: 'admin@ruckushub' },
          { badges: { contains: 'Administrator' } }
        ]
      }
    })

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists, skipping creation')
    } else {
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@ruckushub.com',
          name: 'Admin User',
          title: 'System Administrator',
          department: 'IT',
          location: 'Remote',
          avatar: '/placeholder-user.jpg',
          bio: 'System Administrator for RuckusHub',
          password: adminUserPassword,
          reputation: 0,
          points: 0,
          level: 1,
          badges: 'Administrator',
        },
      })
      console.log('✅ Admin user created:', adminUser.email)
    }
  } catch (error) {
    console.log('⚠️ Admin user creation failed:', error)
  }

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
