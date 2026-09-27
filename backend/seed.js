/**
 * Seed Script — Run once to populate demo data
 * Usage: node seed.js
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Student from './models/Student.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Student.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create users
  const users = [
    { name: 'Super Admin', email: 'superadmin@school.com', password: 'admin123',   role: 'SUPER_ADMIN' },
    { name: 'Dr. Ramesh',  email: 'admin@school.com',     password: 'admin123',   role: 'ADMIN'       },
    { name: 'Ms. Priya',   email: 'teacher@school.com',   password: 'teacher123', role: 'TEACHER'     },
  ];

  for (const u of users) {
    u.password = await bcrypt.hash(u.password, 12);
  }
  await User.insertMany(users);
  console.log('👤 Users created');

  // Create students
  const students = [
    { studentId: 'STU001', name: 'Rahul Kumar',  className: 'CSE-A', year: 1, rollNumber: '01',
      parent: { name: 'Suresh Kumar',  whatsappNumber: '919876543210', relation: 'Father' } },
    { studentId: 'STU002', name: 'Ravi Sharma',  className: 'CSE-A', year: 1, rollNumber: '02',
      parent: { name: 'Ramesh Sharma', whatsappNumber: '919988776655', relation: 'Father' } },
    { studentId: 'STU003', name: 'Kiran Reddy',  className: 'CSE-A', year: 2, rollNumber: '03',
      parent: { name: 'Vijay Reddy',   whatsappNumber: '919123456789', relation: 'Father' } },
    { studentId: 'STU004', name: 'Priya Patel',  className: 'CSE-B', year: 2, rollNumber: '01',
      parent: { name: 'Sunil Patel',   whatsappNumber: '919871234560', relation: 'Father' } },
    { studentId: 'STU005', name: 'Aman Khan',    className: 'CSE-B', year: 3, rollNumber: '02',
      parent: { name: 'Imran Khan',    whatsappNumber: '919912345670', relation: 'Father' } },
    { studentId: 'STU006', name: 'Sneha Rao',    className: 'CSE-B', year: 3, rollNumber: '03',
      parent: { name: 'Srinivas Rao',  whatsappNumber: '919923456780', relation: 'Father' } },
    { studentId: 'STU007', name: 'Deepak Nair',  className: 'ECE-A', year: 4, rollNumber: '01',
      parent: { name: 'Rajan Nair',    whatsappNumber: '919934567890', relation: 'Father' } },
    { studentId: 'STU008', name: 'Ananya Iyer',  className: 'ECE-A', year: 4, rollNumber: '02',
      parent: { name: 'Venkat Iyer',   whatsappNumber: '919945678901', relation: 'Father' } },
    // Student with missing WhatsApp — to demo FAILED notification
    { studentId: 'STU009', name: 'Rohit Verma',  className: 'ECE-A', year: 1, rollNumber: '03',
      parent: { name: 'Anil Verma',    whatsappNumber: '',             relation: 'Father' } },
    { studentId: 'STU010', name: 'Meena Gupta',  className: 'CSE-A', year: 2, rollNumber: '04',
      parent: { name: 'Rajiv Gupta',   whatsappNumber: '919956789012', relation: 'Father' } },
  ];

  await Student.insertMany(students);
  console.log(`🎓 ${students.length} students created`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@school.com     / admin123');
  console.log('  Teacher: teacher@school.com   / teacher123\n');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
