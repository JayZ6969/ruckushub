import { prisma } from '../lib/db'

async function cleanup() {
  console.log('🧹 Cleaning up database...')

  try {
    // Reset all user points to 0
    const updatedUsers = await prisma.user.updateMany({
      data: {
        points: 0,
        reputation: 0,
        level: 1
      }
    })
    console.log(`✅ Reset points for ${updatedUsers.count} users`)

    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'admin' } },
          { name: { contains: 'Admin' } },
          { badges: { contains: 'Administrator' } }
        ]
      }
    })

    console.log(`Found ${adminUsers.length} admin users:`)
    adminUsers.forEach((user: any) => {
      console.log(`- ${user.email} (${user.name})`)
    })

    // Keep only one admin user (the first one found)
    if (adminUsers.length > 1) {
      const usersToDelete = adminUsers.slice(1) // Keep first, delete rest
      
      for (const user of usersToDelete) {
        // Delete related data first (questions, answers, votes, etc.)
        await prisma.vote.deleteMany({ where: { userId: user.id } })
        await prisma.answer.deleteMany({ where: { authorId: user.id } })
        await prisma.question.deleteMany({ where: { authorId: user.id } })
        await prisma.rewardRedemption.deleteMany({ where: { userId: user.id } })
        
        // Delete the user
        await prisma.user.delete({ where: { id: user.id } })
        console.log(`✅ Deleted duplicate admin user: ${user.email}`)
      }
    }

    console.log('🎉 Database cleanup completed!')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

cleanup()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
