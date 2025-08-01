import { prisma } from '../lib/db'

async function resetAllPoints() {
  console.log('🔄 Resetting all user points...')

  try {
    // Reset all user points, reputation, and level
    const result = await prisma.user.updateMany({
      data: {
        points: 0,
        reputation: 0,
        level: 1
      }
    })

    console.log(`✅ Successfully reset points for ${result.count} users`)
    
    // Show updated user stats
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        points: true,
        reputation: true,
        level: true
      }
    })

    console.log('\n📊 Updated user stats:')
    users.forEach((user: any) => {
      console.log(`- ${user.name} (${user.email}): ${user.points} points, ${user.reputation} reputation, level ${user.level}`)
    })

    console.log('\n🎉 All user points have been reset successfully!')
  } catch (error) {
    console.error('❌ Error resetting points:', error)
    throw error
  }
}

resetAllPoints()
  .catch((e) => {
    console.error('❌ Failed to reset points:', e)
    process.exit(1)
  })
