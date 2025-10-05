import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Get initial admin email from environment variable
  const INITIAL_ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL;

  if (!INITIAL_ADMIN_EMAIL) {
    console.log('⚠️  INITIAL_ADMIN_EMAIL not set. Skipping admin user creation.');
    console.log('💡 Set INITIAL_ADMIN_EMAIL environment variable to create an admin user.');
    return;
  }

  // Check if admin user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: INITIAL_ADMIN_EMAIL }, { primaryEmail: INITIAL_ADMIN_EMAIL }],
    },
  });

  if (existingUser) {
    // Update existing user to admin role
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: UserRole.ADMIN },
    });

    console.log(`✅ Updated existing user to ADMIN role:`);
    console.log(`   - ID: ${updated.id}`);
    console.log(`   - Email: ${updated.email || updated.primaryEmail}`);
    console.log(`   - Username: ${updated.userid}`);
  } else {
    // Create new admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        userid: 'admin',
        email: INITIAL_ADMIN_EMAIL,
        primaryEmail: INITIAL_ADMIN_EMAIL,
        nickname: 'Administrator',
        password: hashedPassword,
        isVerified: true,
        role: UserRole.ADMIN,
      },
    });

    console.log(`✅ Created new ADMIN user:`);
    console.log(`   - ID: ${adminUser.id}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Username: ${adminUser.userid}`);
    console.log(`   - Password: Admin123! (⚠️  Change this immediately!)`);
  }

  console.log('\n✨ Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
