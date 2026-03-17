require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Course = require('./models/Course');
const ClassInstance = require('./models/ClassInstance');
const Assessment = require('./models/Assessment');
const Enrollment = require('./models/Enrollment');
const Feedback = require('./models/Feedback');
const InstructorReport = require('./models/InstructorReport');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ruet_obe';

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
    await Feedback.deleteMany({});
    await InstructorReport.deleteMany({});

    console.log('Creating ECE Department...');
    const eceDept = await Department.create({
      name: 'Electrical and Computer Engineering',
      shortName: 'ECE',
      establishedYear: 2021,
      introduction: 'A new department focusing on modern computational engineering.'
    });

    console.log('Creating Admin & Teachers...');
    const centralAdmin = await User.create({
      uid: 'admin_central_uid',
      role: 'CENTRAL_ADMIN',
      email: 'admin_central@ruet.ac.bd'
    });

    const deptAdmin = await User.create({
      uid: 'admin_dept_uid',
      role: 'DEPT_ADMIN',
      email: 'admin_dept_ece@ruet.ac.bd'
    });

    const teacher1 = await User.create({
      uid: 'teacher1_uid',
      role: 'TEACHER',
      email: 'dr.john@ece.ruet.ac.bd'
    });

    const teacher2 = await User.create({
      uid: 'teacher2_uid',
      role: 'TEACHER',
      email: 'jane.smith@ece.ruet.ac.bd'
    });

    console.log('Creating Courses...');
    const theoryCourse = await Course.create({
      courseCode: 'ECE 3101',
      courseName: 'Signals and Systems',
      credit: 3,
      type: 'Theory',
      department: eceDept._id
    });

    const sessionalCourse = await Course.create({
      courseCode: 'ECE 3102',
      courseName: 'Signals and Systems Lab',
      credit: 1.5,
      type: 'Sessional',
      department: eceDept._id
    });

    console.log('Creating Class Instances...');
    const theoryInstance = await ClassInstance.create({
      course: theoryCourse._id,
      series: 2021,
      section: 'A',
      teacher: teacher1._id,
      status: 'Running',
      coPoMapping: [
        { co: 'CO1', po: ['PO1', 'PO2'] },
        { co: 'CO2', po: ['PO2', 'PO3'] },
        { co: 'CO3', po: ['PO3', 'PO4'] },
        { co: 'CO4', po: ['PO4', 'PO5'] }
      ]
    });

    const sessionalInstance = await ClassInstance.create({
      course: sessionalCourse._id,
      series: 2021,
      section: 'A',
      teacher: teacher2._id,
      status: 'Running',
      coPoMapping: [
        { co: 'CO1', po: ['PO5', 'PO9'] },
        { co: 'CO2', po: ['PO9', 'PO10'] }
      ]
    });

    console.log('Creating Assessments...');
    // Theory Assessments
    const tAsmts = [];
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'CT-1', type: 'CT', totalMarks: 20, mappedCO: 'CO1' }));
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'CT-2', type: 'CT', totalMarks: 20, mappedCO: 'CO2' }));
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'CT-3', type: 'CT', totalMarks: 20, mappedCO: 'CO3' }));
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'CT-4', type: 'CT', totalMarks: 20, mappedCO: 'CO4' }));
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'Assignment', type: 'Assignment', totalMarks: 10, mappedCO: 'CO1' }));
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'Final-Q1', type: 'Final', totalMarks: 15, mappedCO: 'CO1' }));
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'Final-Q2', type: 'Final', totalMarks: 15, mappedCO: 'CO2' }));
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'Final-Q3', type: 'Final', totalMarks: 15, mappedCO: 'CO3' }));
    tAsmts.push(await Assessment.create({ classInstance: theoryInstance._id, title: 'Final-Q4', type: 'Final', totalMarks: 15, mappedCO: 'CO4' }));
    
    // Sessional Assessments
    const sAsmts = [];
    sAsmts.push(await Assessment.create({ classInstance: sessionalInstance._id, title: 'Quiz', type: 'Quiz', totalMarks: 20, mappedCO: 'CO1' }));
    sAsmts.push(await Assessment.create({ classInstance: sessionalInstance._id, title: 'Report', type: 'Report', totalMarks: 45, mappedCO: 'CO2' }));
    sAsmts.push(await Assessment.create({ classInstance: sessionalInstance._id, title: 'LabFinal', type: 'LabFinal', totalMarks: 25, mappedCO: 'CO2' }));

    console.log('Generating 60 Students and Enrollments...');
    
    const getRandomScore = (max) => Math.floor(Math.random() * (max + 1));
    const attendanceDates = [
      new Date('2024-01-10'), new Date('2024-01-17'), new Date('2024-01-24'), 
      new Date('2024-01-31'), new Date('2024-02-07'), new Date('2024-02-14')
    ];

    for (let i = 1; i <= 60; i++) {
      const rollNumber = 2103000 + i;
      const uid = `student_uid_${rollNumber}`;
      const email = `${rollNumber}@student.ruet.ac.bd`;

      const student = await User.create({
        uid,
        role: 'STUDENT',
        email
      });

      // Theory Enrollment
      const theoryAttendance = attendanceDates.map(date => ({
        date,
        status: Math.random() > 0.1 ? 'Present' : 'Absent'
      }));

      const theoryMarks = tAsmts.map(ast => ({
        assessment: ast._id,
        rawScore: getRandomScore(ast.totalMarks)
      }));

      await Enrollment.create({
        student: student._id,
        classInstance: theoryInstance._id,
        attendanceRecord: theoryAttendance,
        marks: theoryMarks
      });

      // Sessional Enrollment
      const sessionalAttendance = attendanceDates.map(date => ({
        date,
        status: Math.random() > 0.05 ? 'Present' : 'Absent'
      }));

      const sessionalMarks = sAsmts.map(ast => ({
        assessment: ast._id,
        rawScore: getRandomScore(ast.totalMarks)
      }));

      await Enrollment.create({
        student: student._id,
        classInstance: sessionalInstance._id,
        attendanceRecord: sessionalAttendance,
        marks: sessionalMarks
      });
    }

    console.log('Successfully seeded database with demo data!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
