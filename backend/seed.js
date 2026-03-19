require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Course = require('./models/Course');
const ClassInstance = require('./models/ClassInstance');
const Assessment = require('./models/Assessment');
const Enrollment = require('./models/Enrollment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ruet_obe';

const RUET_DEPARTMENTS = [
  { name: 'Electrical and Electronic Engineering', shortName: 'EEE', establishedYear: 2003, hasSections: true, sectionCount: 3 },
  { name: 'Computer Science and Engineering', shortName: 'CSE', establishedYear: 2003, hasSections: true, sectionCount: 2 },
  { name: 'Electronics and Telecommunication Engineering', shortName: 'ETE', establishedYear: 2003, hasSections: false, sectionCount: 0 },
  { name: 'Electrical and Computer Engineering', shortName: 'ECE', establishedYear: 2021, hasSections: false, sectionCount: 0 },
  { name: 'Civil Engineering', shortName: 'CE', establishedYear: 2003, hasSections: true, sectionCount: 2 },
  { name: 'Urban and Regional Planning', shortName: 'URP', establishedYear: 2015, hasSections: false, sectionCount: 0 },
  { name: 'Architecture', shortName: 'Arch', establishedYear: 2015, hasSections: false, sectionCount: 0 },
  { name: 'Building Engineering and Construction Management', shortName: 'BECM', establishedYear: 2015, hasSections: false, sectionCount: 0 },
  { name: 'Mechanical Engineering', shortName: 'ME', establishedYear: 2003, hasSections: true, sectionCount: 2 },
  { name: 'Industrial and Production Engineering', shortName: 'IPE', establishedYear: 2009, hasSections: false, sectionCount: 0 },
  { name: 'Materials Science and Engineering', shortName: 'MSE', establishedYear: 2015, hasSections: false, sectionCount: 0 },
  { name: 'Chemical Engineering', shortName: 'ChE', establishedYear: 2015, hasSections: false, sectionCount: 0 },
  { name: 'Computer and Communication Engineering', shortName: 'CME', establishedYear: 2021, hasSections: false, sectionCount: 0 },
  { name: 'Mechatronics Engineering', shortName: 'MTE', establishedYear: 2015, hasSections: false, sectionCount: 0 },
  { name: 'Chemistry', shortName: 'Chem', establishedYear: 2003, hasSections: false, sectionCount: 0 },
  { name: 'Physics', shortName: 'Phy', establishedYear: 2003, hasSections: false, sectionCount: 0 },
  { name: 'Mathematics', shortName: 'Math', establishedYear: 2003, hasSections: false, sectionCount: 0 },
  { name: 'Humanities', shortName: 'Hum', establishedYear: 2003, hasSections: false, sectionCount: 0 },
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
      { name: 'Dr. M. A. Rashid', email: 'rashid@ece.ruet.ac.bd', dept: 'ECE', designation: 'Professor' },
      { name: 'Dr. S. K. Sarker', email: 'sarker@ece.ruet.ac.bd', dept: 'ECE', designation: 'Associate Professor' },
      { name: 'Dr. A. B. Siddique', email: 'siddique@cse.ruet.ac.bd', dept: 'CSE', designation: 'Professor' },
      { name: 'Md. N. Islam', email: 'nislam@cse.ruet.ac.bd', dept: 'CSE', designation: 'Assistant Professor' },
      { name: 'Dr. R. K. Das', email: 'rkdas@eee.ruet.ac.bd', dept: 'EEE', designation: 'Professor' },
      { name: 'Dr. F. Haque', email: 'fhaque@me.ruet.ac.bd', dept: 'ME', designation: 'Associate Professor' },
    ];

    for (const t of teacherData) {
      const teacher = await User.create({
        name: t.name,
        email: t.email,
        password: '123456',
        role: 'TEACHER',
        department: departments[t.dept]._id,
        designation: t.designation
      });
      teachers.push(teacher);
      console.log(`  ✓ ${t.email} (${t.dept})`);
    }

    console.log('\nCreating Courses...');
    const eceCourses = [
      { courseCode: 'ECE 3101', courseName: 'Signals and Systems', credit: 3, type: 'Theory', department: departments.ECE._id },
      { courseCode: 'ECE 3102', courseName: 'Signals and Systems Lab', credit: 1.5, type: 'Sessional', department: departments.ECE._id },
    ];
    const cseCourses = [
      { courseCode: 'CSE 3101', courseName: 'Database Systems', credit: 3, type: 'Theory', department: departments.CSE._id },
      { courseCode: 'CSE 3102', courseName: 'Database Systems Lab', credit: 1.5, type: 'Sessional', department: departments.CSE._id },
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
      { course: createdCourses['ECE 3101'], teacher: teachers[0], section: 'A', series: 2021, coPoMapping: [
        { co: 'CO1', po: ['PO1', 'PO2'] }, { co: 'CO2', po: ['PO2', 'PO3'] },
        { co: 'CO3', po: ['PO3', 'PO4'] }, { co: 'CO4', po: ['PO4', 'PO5'] }
      ]},
      { course: createdCourses['ECE 3102'], teacher: teachers[1], section: 'A', series: 2021, coPoMapping: [
        { co: 'CO1', po: ['PO5', 'PO9'] }, { co: 'CO2', po: ['PO9', 'PO10'] }
      ]},
      { course: createdCourses['CSE 3101'], teacher: teachers[2], section: 'A', series: 2021, coPoMapping: [
        { co: 'CO1', po: ['PO1', 'PO2'] }, { co: 'CO2', po: ['PO1', 'PO3'] },
        { co: 'CO3', po: ['PO2', 'PO5'] }, { co: 'CO4', po: ['PO3', 'PO4'] }
      ]},
      { course: createdCourses['CSE 3102'], teacher: teachers[3], section: 'A', series: 2021, coPoMapping: [
        { co: 'CO1', po: ['PO5', 'PO9'] }, { co: 'CO2', po: ['PO9', 'PO11'] }
      ]},
    ];

    for (const inst of instanceData) {
      const created = await ClassInstance.create({
        course: inst.course._id,
        series: inst.series,
        section: inst.section,
        teacher: inst.teacher._id,
        status: 'Running',
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

    console.log('\nCreating Students & Enrollments...');
    const getRandomScore = (max) => Math.floor(Math.random() * (max * 0.6 + max * 0.4 * Math.random()));
    const attendanceDates = [
      new Date('2025-01-05'), new Date('2025-01-12'), new Date('2025-01-19'),
      new Date('2025-01-26'), new Date('2025-02-02'), new Date('2025-02-09'),
      new Date('2025-02-16'), new Date('2025-02-23'), new Date('2025-03-02'),
    ];

    let studentCount = 0;
    for (const dept of ['ECE', 'CSE']) {
      const deptId = departments[dept]._id;
      const rollStart = dept === 'ECE' ? 2103001 : 2103101;
      const deptInstances = Object.entries(instances).filter(([code]) => code.startsWith(dept));

      for (let i = 0; i < 30; i++) {
        const rollNumber = (rollStart + i).toString();
        const email = `${rollNumber}@student.ruet.ac.bd`;

        const student = await User.create({
          name: `Student ${rollNumber}`,
          email,
          password: '123456',
          role: 'STUDENT',
          department: deptId,
          rollNumber,
          series: 2021,
          section: 'A'
        });

        for (const [courseCode, inst] of deptInstances) {
          const courseAssessments = createdAssessments.filter(a => a.classInstance.toString() === inst._id.toString());

          const attendance = attendanceDates.map(date => ({
            date,
            status: Math.random() > 0.12 ? 'Present' : 'Absent'
          }));

          const marks = courseAssessments.map(ast => ({
            assessment: ast._id,
            rawScore: getRandomScore(ast.totalMarks)
          }));

          await Enrollment.create({
            student: student._id,
            classInstance: inst._id,
            attendanceRecord: attendance,
            marks
          });
        }
        studentCount++;
      }
      console.log(`  ✓ ${dept}: 30 students enrolled`);
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
    console.log(`   Student (ECE): 2103001@student.ruet.ac.bd`);
    console.log(`   Student (CSE): 2103101@student.ruet.ac.bd`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
