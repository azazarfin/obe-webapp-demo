require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Department = require('./models/Department');
const Course = require('./models/Course');
const ClassInstance = require('./models/ClassInstance');
const Assessment = require('./models/Assessment');
const Enrollment = require('./models/Enrollment');
const InstructorReport = require('./models/InstructorReport');
const Feedback = require('./models/Feedback');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ruet_obe';

const RUET_DEPARTMENTS = [
  { 
    name: 'Electrical and Electronic Engineering', 
    shortName: 'EEE', 
    establishedYear: 2003, 
    hasSections: true, 
    sectionCount: 3,
    introduction: 'The Department of Electrical & Electronic Engineering (EEE) is one of the oldest and most prestigious departments at RUET.'
  },
  { 
    name: 'Computer Science and Engineering', 
    shortName: 'CSE', 
    establishedYear: 2003, 
    hasSections: true, 
    sectionCount: 3,
    introduction: 'CSE at RUET focuses on cutting-edge research and excellence in software and hardware engineering.'
  },
  { 
    name: 'Electronics and Telecommunication Engineering', 
    shortName: 'ETE', 
    establishedYear: 2003, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'ETE department prepares students for the rapidly evolving telecommunications industry.'
  },
  { 
    name: 'Electrical and Computer Engineering', 
    shortName: 'ECE', 
    establishedYear: 2021, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'The ECE department is a modern addition to RUET, bridging electrical engineering and computer science.'
  },
  { 
    name: 'Civil Engineering', 
    shortName: 'CE', 
    establishedYear: 2003, 
    hasSections: true, 
    sectionCount: 3,
    introduction: 'One of the foundation departments of RUET, focusing on infrastructure and construction.'
  },
  { 
    name: 'Urban and Regional Planning', 
    shortName: 'URP', 
    establishedYear: 2015, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'URP focuses on sustainable urban development and planning.'
  },
  { 
    name: 'Architecture', 
    shortName: 'Arch', 
    establishedYear: 2015, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'The Architecture department balances artistic design with engineering precision.'
  },
  { 
    name: 'Building Engineering and Construction Management', 
    shortName: 'BECM', 
    establishedYear: 2015, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'BECM prepares students for leadership in the construction industry.'
  },
  { 
    name: 'Mechanical Engineering', 
    shortName: 'ME', 
    establishedYear: 2003, 
    hasSections: true, 
    sectionCount: 3,
    introduction: 'ME department at RUET is known for its rigorous training in thermal and machine design.'
  },
  { 
    name: 'Industrial and Production Engineering', 
    shortName: 'IPE', 
    establishedYear: 2009, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'IPE focuses on system optimization and industrial management.'
  },
  { 
    name: 'Materials Science and Engineering', 
    shortName: 'MSE', 
    establishedYear: 2015, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'MSE explores the properties and applications of modern materials.'
  },
  { 
    name: 'Chemical Engineering', 
    shortName: 'ChE', 
    establishedYear: 2015, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'ChE focuses on process engineering and chemical manufacturing.'
  },
  { 
    name: 'Computer and Communication Engineering', 
    shortName: 'CME', 
    establishedYear: 2021, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'CME is dedicated to the study of modern communication networks.'
  },
  { 
    name: 'Mechatronics Engineering', 
    shortName: 'MTE', 
    establishedYear: 2015, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'MTE combines mechanics, electronics, and robotics.'
  },
  { 
    name: 'Chemistry', 
    shortName: 'Chem', 
    establishedYear: 2003, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'The department providing fundamental knowledge in chemical sciences.'
  },
  { 
    name: 'Physics', 
    shortName: 'Phy', 
    establishedYear: 2003, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'The department providing fundamental knowledge in physical sciences.'
  },
  { 
    name: 'Mathematics', 
    shortName: 'Math', 
    establishedYear: 2003, 
    hasSections: false, 
    sectionCount: 0,
    introduction: 'The department providing essential mathematical tools for engineering.'
  },
  { 
    name: 'Humanities', 
    shortName: 'Hum', 
    establishedYear: 2003, 
    hasSections: false, 
    sectionCount: 0, 
    introduction: 'Providing social and ethical context for technical education.' 
  },
  { 
    name: 'Institute of Energy and Environmental Studies', 
    shortName: 'IEES', 
    establishedYear: 2014, 
    hasSections: false, 
    sectionCount: 0, 
    introduction: 'IEES focuses on sustainable energy solutions and environmental preservation.' 
  },
  { 
    name: 'Institute of Information and Communication Technology', 
    shortName: 'IICT', 
    establishedYear: 2016, 
    hasSections: false, 
    sectionCount: 0, 
    introduction: 'IICT provides a platform for teaching, learning and research in ICT.' 
  },
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing database...');
    // Clear all collections to ensure a clean start
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Course.deleteMany({}),
      ClassInstance.deleteMany({}),
      Assessment.deleteMany({}),
      Enrollment.deleteMany({}),
      InstructorReport.deleteMany({}),
      Feedback.deleteMany({})
    ]);

    console.log('Creating Departments...');
    const departments = {};
    const deptUpperMap = {}; // For case-insensitive lookup
    for (const dept of RUET_DEPARTMENTS) {
      const created = await Department.create(dept);
      departments[dept.shortName] = created;
      deptUpperMap[dept.shortName.toUpperCase()] = created._id;
      console.log(`  ✓ ${dept.shortName} — ${dept.name}`);
    }


    console.log('\nCreating Admins...');
    // Create Central Admin
    await User.create({
      name: 'Central Admin',
      email: 'admin@obe.ruet.ac.bd',
      password: '123456',
      role: 'CENTRAL_ADMIN'
    });
    console.log('  ✓ Central Admin (admin@obe.ruet.ac.bd)');

    // Create Department Admins
    for (const dept of RUET_DEPARTMENTS) {
      const shortLower = dept.shortName.toLowerCase();
      await User.create({
        name: `${dept.shortName} Admin`,
        email: `admin@${shortLower}.ruet.ac.bd`,
        password: '123456',
        role: 'DEPT_ADMIN',
        department: departments[dept.shortName]._id
      });
    }
    console.log(`  ✓ ${RUET_DEPARTMENTS.length} Department Admins created.`);

    // --- SEED TEACHERS FROM JSON ---
    console.log('\nSeeding Teachers from ruet_teachers.json...');
    const teachersPath = path.join(__dirname, '..', 'ruet_teachers.json');
    if (fs.existsSync(teachersPath)) {
      const teachersData = JSON.parse(fs.readFileSync(teachersPath, 'utf8'));
      
      const processedEmails = new Set();
      let teacherCount = 0;
      for (const data of teachersData) {
        const deptId = deptUpperMap[data.department.toUpperCase()];
        if (!deptId) continue;

        // Preference for ruet.ac.bd email
        let email = data.emails.find(e => e.toLowerCase().endsWith('ruet.ac.bd'));
        if (!email) email = data.emails[0];
        if (!email) continue;
        
        const lowerEmail = email.toLowerCase();
        if (processedEmails.has(lowerEmail)) {
          continue; // Skip duplicates
        }

        await User.create({
          name: data.name,
          email: lowerEmail,
          password: '123456',
          role: 'TEACHER',
          department: deptId,
          designation: data.designation,
          teacherType: 'Host',
          onLeave: data.is_on_leave || false,
          leaveReason: ''
        });
        processedEmails.add(lowerEmail);
        teacherCount++;
      }
      console.log(`  ✓ ${teacherCount} teachers seeded (skipped duplicates).`);
    } else {
      console.warn('  ⚠ ruet_teachers.json not found, skipping teacher seeding.');
    }

    // --- SEED COURSES FROM JSON ---
    console.log('\nSeeding ECE Courses from ece-courses.json...');
    const coursesPath = path.join(__dirname, '..', 'ece-courses.json');
    if (fs.existsSync(coursesPath)) {
      const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
      const eceId = departments['ECE']?._id;
      
      const processedCourses = new Set();
      let courseCount = 0;
      if (eceId) {
        for (const c of coursesData) {
          if (processedCourses.has(c.courseCode)) {
            continue; // Skip duplicate course codes
          }

          await Course.create({
            courseCode: c.courseCode,
            courseName: c.courseName,
            credit: c.credit,
            type: c.type,
            department: eceId,
            semester: c.semester,
            syllabus: c.syllabus
          });
          processedCourses.add(c.courseCode);
          courseCount++;
        }
        console.log(`  ✓ ${courseCount} ECE courses seeded (skipped duplicates).`);
      } else {
        console.warn('  ⚠ ECE department not found, skipping ECE course seeding.');
      }
    } else {
      console.warn('  ⚠ ece-courses.json not found, skipping course seeding.');
    }

    // --- SEED ECE 2023 STUDENTS FROM CSV ---
    console.log('\nSeeding ECE 2023 students from CSV...');
    const csvPath = path.join(__dirname, '..', 'RUET_ECE_2023_students.csv');
    if (fs.existsSync(csvPath)) {
      const csvData = fs.readFileSync(csvPath, 'utf8');
      const lines = csvData.split('\n');
      const eceId = departments['ECE']._id;
      let ece2023Count = 0;

      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        const [rollNumber, name] = line.split(',').map(s => s.trim());
        if (!rollNumber || !name) continue;

        const email = `${rollNumber}@student.ruet.ac.bd`;
        await User.create({
          name,
          email,
          password: '123456',
          role: 'STUDENT',
          department: eceId,
          rollNumber,
          series: 2023,
          section: 'N/A'
        });
        ece2023Count++;
      }
      console.log(`  ✓ ECE: ${ece2023Count} students from 2023 series created.`);
    } else {
      console.warn('  ⚠ RUET_ECE_2023_students.csv not found, skipping student seeding.');
    }

    console.log(`\n✅ Unified Seed complete!`);
    console.log(`📋 Login credentials (password: 123456):`);
    console.log(`   Central Admin: admin@obe.ruet.ac.bd`);
    console.log(`   ECE Admin: admin@ece.ruet.ac.bd`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
