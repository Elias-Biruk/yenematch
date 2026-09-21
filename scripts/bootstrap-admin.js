#!/usr/bin/env node

/**
 * Admin Bootstrap Script
 * 
 * This script promotes an existing user to SUPER_ADMIN role.
 * It is intended for one-time use during initial deployment.
 * 
 * SECURITY NOTES:
 * - This is a server-side script, not a public HTTP endpoint
 * - It requires direct console access to run
 * - It creates an audit log entry
 * - It refuses to promote users who are already SUPER_ADMIN
 * - It requires explicit confirmation before executing
 * 
 * USAGE:
 *   node scripts/bootstrap-admin.js <userId>
 * 
 * ENVIRONMENT:
 *   Must have DATABASE_URL configured in .env or environment
 */

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes')
    })
  })
}

async function main() {
  const userId = process.argv[2]

  if (!userId) {
    console.error('❌ Error: User ID is required')
    console.error('Usage: node scripts/bootstrap-admin.js <userId>')
    process.exit(1)
  }

  console.log('🔐 Admin Bootstrap Script')
  console.log('========================')
  console.log()

  try {
    // Check if user exists
    console.log(`🔍 Looking up user: ${userId}`)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) {
      console.error('❌ Error: User not found')
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName || ''}`)
    console.log(`   Current role: ${user.role}`)
    console.log()

    // Check if already SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      console.log('⚠️  This user is already a SUPER_ADMIN')
      console.log('   No action needed.')
      process.exit(0)
    }

    // Check if already ADMIN
    if (user.role === 'ADMIN') {
      console.log('⚠️  This user is already an ADMIN')
      console.log('   This script will promote them to SUPER_ADMIN.')
    }

    // Confirm action
    console.log('⚠️  This action will:')
    console.log('   - Promote this user to SUPER_ADMIN role')
    console.log('   - Create an audit log entry')
    console.log('   - Grant full administrative access')
    console.log()

    const confirmed = await confirm('Do you want to proceed?')

    if (!confirmed) {
      console.log('❌ Action cancelled by user')
      process.exit(0)
    }

    // Promote user to SUPER_ADMIN
    console.log('📝 Promoting user to SUPER_ADMIN...')
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'SUPER_ADMIN' },
    })

    // Create audit log
    console.log('📋 Creating audit log entry...')
    await prisma.auditLog.create({
      data: {
        adminId: userId,
        targetId: userId,
        action: 'ADMIN_ROLE_GRANTED',
        reason: 'Initial admin bootstrap via bootstrap-admin.js script',
        metadata: JSON.stringify({
          source: 'bootstrap-admin.js',
          previousRole: user.role,
          newRole: 'SUPER_ADMIN',
        }),
      },
    })

    console.log()
    console.log('✅ Admin bootstrap completed successfully!')
    console.log(`   User ${updatedUser.firstName} ${updatedUser.lastName || ''} is now SUPER_ADMIN`)
    console.log()
    console.log('📝 IMPORTANT:')
    console.log('   - This user now has full administrative access')
    console.log('   - An audit log entry has been created')
    console.log('   - You can now access the admin panel at /admin/dashboard')
    console.log()
    console.log('⚠️  SECURITY REMINDER:')
    console.log('   - Keep this user account secure')
    console.log('   - Consider enabling 2FA if available')
    console.log('   - Monitor audit logs regularly')
    console.log('   - This script should not be run again unless needed')

  } catch (error) {
    console.error('❌ Error during admin bootstrap:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
