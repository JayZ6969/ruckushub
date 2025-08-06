import { prisma } from "../lib/db"

async function checkAdmin() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    console.log("All users in database:")
    users.forEach(user => {
      console.log(`- ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Name: ${user.name}`)
      console.log(`  Created: ${user.createdAt}`)
      console.log("")
    })

    // Look for admin user by email
    const adminUser = users.find(user => user.email === 'admin@ruckushub.com')
    console.log(`Found admin user: ${adminUser ? 'Yes' : 'No'}`)
    
    if (adminUser) {
      console.log("Admin credentials for testing:")
      console.log(`Email: ${adminUser.email}`)
      console.log(`Password: admin123 (default from seed)`)
    } else {
      console.log("No admin user found. You may need to run the seed script.")
    }
  } catch (error) {
    console.error("Error checking admin:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
