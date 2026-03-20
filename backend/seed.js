require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Department = require('./models/Department');
const Course = require('./models/Course');
const ClassInstance = require('./models/ClassInstance');
const Assessment = require('./models/Assessment');
const Enrollment = require('./models/Enrollment');

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
    sectionCount: 2,
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
    sectionCount: 2,
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
    sectionCount: 2,
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
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing database...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await ClassInstance.deleteMany({});
    await Assessment.deleteMany({});
    await Enrollment.deleteMany({});

    console.log('Creating Departments...');
    const departments = {};
    for (const dept of RUET_DEPARTMENTS) {
      const created = await Department.create(dept);
      departments[dept.shortName] = created;
      console.log(`  ✓ ${dept.shortName} — ${dept.name}`);
    }

    console.log('\nCreating Central Admin...');
    await User.create({
      name: 'Central Admin',
      email: 'admin@obe.ruet.ac.bd',
      password: '123456',
      role: 'CENTRAL_ADMIN'
    });
    console.log('  ✓ admin@obe.ruet.ac.bd');

    console.log('\nCreating Department Admins...');
    for (const dept of RUET_DEPARTMENTS) {
      const shortLower = dept.shortName.toLowerCase();
      await User.create({
        name: `${dept.shortName} Admin`,
        email: `admin@${shortLower}.ruet.ac.bd`,
        password: '123456',
        role: 'DEPT_ADMIN',
        department: departments[dept.shortName]._id
      });
      console.log(`  ✓ admin@${shortLower}.ruet.ac.bd`);
    }

    console.log('\nCreating Teachers...');
    const teachers = [];

    const teacherData = [
      { name: 'Dr. M. A. Rashid', email: 'rashid@ece.ruet.ac.bd', dept: 'ECE', designation: 'Professor', teacherType: 'Host' },
      { name: 'Dr. S. K. Sarker', email: 'sarker@ece.ruet.ac.bd', dept: 'ECE', designation: 'Associate Professor', teacherType: 'Host', onLeave: true, leaveReason: 'Sabbatical Leave' },
      { name: 'Dr. A. B. Siddique', email: 'siddique@cse.ruet.ac.bd', dept: 'CSE', designation: 'Professor', teacherType: 'Host' },
      { name: 'Md. N. Islam', email: 'nislam@cse.ruet.ac.bd', dept: 'CSE', designation: 'Assistant Professor', teacherType: 'Host' },
      { name: 'Dr. R. K. Das', email: 'rkdas@eee.ruet.ac.bd', dept: 'EEE', designation: 'Professor', teacherType: 'Host' },
      { name: 'Dr. F. Haque', email: 'fhaque@me.ruet.ac.bd', dept: 'ME', designation: 'Associate Professor', teacherType: 'Guest' },
    ];

    for (const t of teacherData) {
      const teacher = await User.create({
        name: t.name,
        email: t.email,
        password: '123456',
        role: 'TEACHER',
        department: departments[t.dept]._id,
        designation: t.designation,
        teacherType: t.teacherType,
        onLeave: t.onLeave || false,
        leaveReason: t.leaveReason || ''
      });
      teachers.push(teacher);
      console.log(`  ✓ ${t.email} (${t.dept})`);
    }

    console.log('\nCreating Courses...');
    const eceCourses = [
      { courseCode: 'ECE 3101', courseName: 'Signals and Systems', credit: 3, type: 'Theory', department: departments.ECE._id, semester: '5th Semester', syllabus: 'Basic concepts of signals and systems, LTI systems, Fourier analysis, Laplace transform.' },
      { courseCode: 'ECE 3102', courseName: 'Signals and Systems Lab', credit: 1.5, type: 'Sessional', department: departments.ECE._id, semester: '5th Semester', syllabus: 'Simulation and practical verification of signal processing concepts using MATLAB.' },
    ];
    const cseCourses = [
      { courseCode: 'CSE 3101', courseName: 'Database Systems', credit: 3, type: 'Theory', department: departments.CSE._id, semester: '5th Semester', syllabus: 'Relational model, SQL, normalization, transactions, and indexing.' },
      { courseCode: 'CSE 3102', courseName: 'Database Systems Lab', credit: 1.5, type: 'Sessional', department: departments.CSE._id, semester: '5th Semester', syllabus: 'Hands-on experience with SQL, database design, and web integration.' },
    ];
    const allCourses = [...eceCourses, ...cseCourses];
    const createdCourses = {};
    for (const c of allCourses) {
      const course = await Course.create(c);
      createdCourses[c.courseCode] = course;
      console.log(`  ✓ ${c.courseCode} — ${c.courseName}`);
    }

    console.log('\nCreating Class Instances...');
    const instances = {};
    const instanceData = [
      { course: createdCourses['ECE 3101'], teacher: teachers[0], section: 'A', series: 2021, status: 'Running', coPoMapping: [
        { co: 'CO1', po: ['PO1', 'PO2'] }, { co: 'CO2', po: ['PO2', 'PO3'] },
        { co: 'CO3', po: ['PO3', 'PO4'] }, { co: 'CO4', po: ['PO4', 'PO5'] }
      ]},
      { course: createdCourses['ECE 3102'], teacher: teachers[1], section: 'A', series: 2021, status: 'Running', coPoMapping: [
        { co: 'CO1', po: ['PO5', 'PO9'] }, { co: 'CO2', po: ['PO9', 'PO10'] }
      ]},
      { course: createdCourses['CSE 3101'], teacher: teachers[2], section: 'A', series: 2021, status: 'Finished', coPoMapping: [
        { co: 'CO1', po: ['PO1', 'PO2'] }, { co: 'CO2', po: ['PO1', 'PO3'] },
        { co: 'CO3', po: ['PO2', 'PO5'] }, { co: 'CO4', po: ['PO3', 'PO4'] }
      ]},
      { course: createdCourses['CSE 3102'], teacher: teachers[3], section: 'A', series: 2021, status: 'Running', coPoMapping: [
        { co: 'CO1', po: ['PO5', 'PO9'] }, { co: 'CO2', po: ['PO9', 'PO11'] }
      ]},
    ];

    for (const inst of instanceData) {
      const created = await ClassInstance.create({
        course: inst.course._id,
        series: inst.series,
        section: inst.section,
        teacher: inst.teacher._id,
        teachers: [inst.teacher._id],
        status: inst.status,
        coPoMapping: inst.coPoMapping
      });
      instances[inst.course.courseCode] = created;
      console.log(`  ✓ ${inst.course.courseCode} — Section ${inst.section} (${inst.teacher.name})`);
    }

    console.log('\nCreating Assessments...');
    const assessments = {};
    const aData = [
      { ci: instances['ECE 3101'], title: 'CT-1', type: 'CT', totalMarks: 20, mappedCO: 'CO1' },
      { ci: instances['ECE 3101'], title: 'CT-2', type: 'CT', totalMarks: 20, mappedCO: 'CO2' },
      { ci: instances['ECE 3101'], title: 'CT-3', type: 'CT', totalMarks: 20, mappedCO: 'CO3' },
      { ci: instances['ECE 3101'], title: 'CT-4', type: 'CT', totalMarks: 20, mappedCO: 'CO4' },
      { ci: instances['ECE 3101'], title: 'Assignment', type: 'Assignment', totalMarks: 10, mappedCO: 'CO1' },
      { ci: instances['ECE 3102'], title: 'Quiz', type: 'Quiz', totalMarks: 20, mappedCO: 'CO1' },
      { ci: instances['ECE 3102'], title: 'Report', type: 'Report', totalMarks: 45, mappedCO: 'CO2' },
      { ci: instances['ECE 3102'], title: 'LabFinal', type: 'LabFinal', totalMarks: 25, mappedCO: 'CO2' },
      { ci: instances['CSE 3101'], title: 'CT-1', type: 'CT', totalMarks: 20, mappedCO: 'CO1' },
      { ci: instances['CSE 3101'], title: 'CT-2', type: 'CT', totalMarks: 20, mappedCO: 'CO2' },
      { ci: instances['CSE 3101'], title: 'CT-3', type: 'CT', totalMarks: 20, mappedCO: 'CO3' },
      { ci: instances['CSE 3101'], title: 'Assignment', type: 'Assignment', totalMarks: 10, mappedCO: 'CO1' },
      { ci: instances['CSE 3102'], title: 'Quiz', type: 'Quiz', totalMarks: 20, mappedCO: 'CO1' },
      { ci: instances['CSE 3102'], title: 'Performance', type: 'Report', totalMarks: 45, mappedCO: 'CO2' },
      { ci: instances['CSE 3102'], title: 'LabFinal', type: 'LabFinal', totalMarks: 25, mappedCO: 'CO2' },
    ];
    const createdAssessments = [];
    for (const a of aData) {
      const ast = await Assessment.create({ classInstance: a.ci._id, title: a.title, type: a.type, totalMarks: a.totalMarks, mappedCO: a.mappedCO });
      createdAssessments.push(ast);
      if (!assessments[a.ci.course.toString()]) assessments[a.ci.course.toString()] = [];
      assessments[a.ci.course.toString()].push(ast);
    }
    console.log(`  ✓ ${createdAssessments.length} assessments created`);

    let studentCount = 0;
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
        studentCount++;
      }
      console.log(`  ✓ ECE: ${ece2023Count} students from 2023 series created`);
    } else {
      console.log('  ⚠ RUET_ECE_2023_students.csv not found, skipping...');
    }

    console.log(`\n✅ Seed complete!`);
    console.log(`   ${Object.keys(departments).length} departments`);
    console.log(`   ${1 + RUET_DEPARTMENTS.length + teachers.length + studentCount} users`);
    console.log(`   ${allCourses.length} courses`);
    console.log(`   ${Object.keys(instances).length} class instances`);
    console.log(`   ${createdAssessments.length} assessments`);
    console.log(`\n📋 Login credentials (password: 123456):`);
    console.log(`   Central Admin: admin@obe.ruet.ac.bd`);
    console.log(`   ECE Admin: admin@ece.ruet.ac.bd`);
    console.log(`   CSE Admin: admin@cse.ruet.ac.bd`);
    console.log(`   Teacher (ECE): rashid@ece.ruet.ac.bd`);
    console.log(`   Teacher (CSE): siddique@cse.ruet.ac.bd`);
    console.log(`   Student (ECE 2023): 2310001@student.ruet.ac.bd`);
    console.log(`   Student (CSE): (None seeded)`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
