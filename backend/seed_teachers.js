const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Department = require('./models/Department');
const User = require('./models/User');

async function seedTeachers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 1. Load departments for mapping (case-insensitive)
    const departments = await Department.find();
    const deptMap = {};
    departments.forEach(d => {
      deptMap[d.shortName.toUpperCase()] = d._id;
    });
    console.log(`Loaded ${departments.length} departments for mapping.`);

    // 2. Read ruet_teachers.json from root
    const jsonPath = path.join(__dirname, '..', 'ruet_teachers.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`File not found: ${jsonPath}`);
    }
    const teachersData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Found ${teachersData.length} teachers in JSON.`);

    // 3. Optional: Clear existing teachers to avoid duplicates from previous run with different emails
    console.log('Clearing existing teachers...');
    await User.deleteMany({ role: 'TEACHER' });

    // 4. Upsert teachers
    let successCount = 0;
    let missingDeptCount = 0;

    for (const data of teachersData) {
      const deptUpper = data.department.toUpperCase();
      const deptId = deptMap[deptUpper];
      if (!deptId) {
        console.warn(`Warning: Department ${data.department} not found for teacher ${data.name}. Skipping...`);
        missingDeptCount++;
        continue;
      }

      // Preference for ruet.ac.bd email
      let email = data.emails.find(e => e.toLowerCase().endsWith('ruet.ac.bd'));
      if (!email) {
        email = data.emails[0];
      }

      if (!email) {
        console.warn(`Warning: No email found for teacher ${data.name}. Skipping...`);
        continue;
      }

      const teacherObj = {
        name: data.name,
        email: email,
        password: hashedPassword, // Use pre-hashed password
        role: 'TEACHER',
        department: deptId,
        designation: data.designation,
        teacherType: 'Host',
        onLeave: data.is_on_leave || false,
        leaveReason: ''
      };

      await User.findOneAndUpdate(
        { email: email },
        { $set: teacherObj },
        { upsert: true }
      );
      successCount++;
    }

    console.log(`Seeding complete: ${successCount} teachers processed.`);
    if (missingDeptCount > 0) {
        console.log(`Note: ${missingDeptCount} teachers were skipped due to missing departments.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error seeding teachers:', error);
    process.exit(1);
  }
}

seedTeachers();
