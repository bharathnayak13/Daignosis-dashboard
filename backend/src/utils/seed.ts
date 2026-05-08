import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Admin
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sdc.com' },
    update: {},
    create: {
      email: 'admin@sdc.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      phone: '+91-9000000001',
      emailVerified: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create Doctors
  const doctorData = [
    { email: 'dr.sharma@sdc.com', firstName: 'Rajesh', lastName: 'Sharma', specialization: 'Cardiologist', license: 'MCI-2024-001', fee: 800 },
    { email: 'dr.patel@sdc.com', firstName: 'Priya', lastName: 'Patel', specialization: 'Neurologist', license: 'MCI-2024-002', fee: 900 },
    { email: 'dr.kumar@sdc.com', firstName: 'Arun', lastName: 'Kumar', specialization: 'General Physician', license: 'MCI-2024-003', fee: 500 },
    { email: 'dr.verma@sdc.com', firstName: 'Sunita', lastName: 'Verma', specialization: 'Pediatrician', license: 'MCI-2024-004', fee: 600 },
  ];

  for (const d of doctorData) {
    const password = await bcrypt.hash('Doctor@123', 12);
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        password,
        firstName: d.firstName,
        lastName: d.lastName,
        role: 'DOCTOR',
        phone: `+91-90000000${Math.floor(Math.random() * 90 + 10)}`,
        emailVerified: true,
      },
    });

    await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialization: d.specialization,
        licenseNumber: d.license,
        experience: Math.floor(Math.random() * 15 + 5),
        consultationFee: d.fee,
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        isAvailable: true,
      },
    });
    console.log(`✅ Doctor created: Dr. ${d.firstName} ${d.lastName}`);
  }

  // Create Receptionist
  const receptionPassword = await bcrypt.hash('Recep@123', 12);
  await prisma.user.upsert({
    where: { email: 'reception@sdc.com' },
    update: {},
    create: {
      email: 'reception@sdc.com',
      password: receptionPassword,
      firstName: 'Meera',
      lastName: 'Nair',
      role: 'RECEPTIONIST',
      phone: '+91-9000000050',
      emailVerified: true,
    },
  });
  console.log('✅ Receptionist created');

  // Create Lab Technician
  const labPassword = await bcrypt.hash('Lab@12345', 12);
  await prisma.user.upsert({
    where: { email: 'lab@sdc.com' },
    update: {},
    create: {
      email: 'lab@sdc.com',
      password: labPassword,
      firstName: 'Ravi',
      lastName: 'Krishnan',
      role: 'LAB_TECHNICIAN',
      phone: '+91-9000000060',
      emailVerified: true,
    },
  });
  console.log('✅ Lab Technician created');

  // Create Sample Patients
  const patientNames = [
    { first: 'Arjun', last: 'Singh', email: 'arjun@gmail.com' },
    { first: 'Lakshmi', last: 'Devi', email: 'lakshmi@gmail.com' },
    { first: 'Mohammed', last: 'Ali', email: 'moh.ali@gmail.com' },
    { first: 'Deepa', last: 'Thomas', email: 'deepa@gmail.com' },
    { first: 'Vikram', last: 'Rao', email: 'vikram@gmail.com' },
  ];

  for (let i = 0; i < patientNames.length; i++) {
    const p = patientNames[i];
    const password = await bcrypt.hash('Patient@123', 12);
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        password,
        firstName: p.first,
        lastName: p.last,
        role: 'PATIENT',
        phone: `+91-98765432${i}0`,
        emailVerified: true,
      },
    });

    await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        dateOfBirth: new Date(1980 + i * 3, i % 12, 15),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        bloodGroup: ['A_POSITIVE', 'B_POSITIVE', 'O_POSITIVE', 'AB_POSITIVE', 'A_NEGATIVE'][i],
        address: `${100 + i} Main Street`,
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'][i],
        state: 'Karnataka',
        allergies: i % 2 === 0 ? ['Penicillin'] : [],
        chronicDiseases: i % 3 === 0 ? ['Hypertension'] : [],
      },
    });
    console.log(`✅ Patient created: ${p.first} ${p.last}`);
  }

  // Create default settings
  const defaultSettings = [
    { key: 'clinic_name', value: 'Smart Diagnostic Center', category: 'general' },
    { key: 'clinic_address', value: '123 Health Street, Mangalore, Karnataka', category: 'general' },
    { key: 'clinic_phone', value: '+91-824-2234567', category: 'general' },
    { key: 'clinic_email', value: 'info@smartdiagnostic.com', category: 'general' },
    { key: 'currency', value: 'INR', category: 'billing' },
    { key: 'tax_rate', value: '18', category: 'billing' },
    { key: 'appointment_duration', value: '30', category: 'appointments' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value, category: s.category },
    });
  }
  console.log('✅ Default settings created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Default Credentials:');
  console.log('Admin:           admin@sdc.com / Admin@123');
  console.log('Doctor:          dr.sharma@sdc.com / Doctor@123');
  console.log('Receptionist:    reception@sdc.com / Recep@123');
  console.log('Lab Technician:  lab@sdc.com / Lab@12345');
  console.log('Patient:         arjun@gmail.com / Patient@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
