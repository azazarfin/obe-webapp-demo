const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Department = require('./models/Department');
const Course = require('./models/Course');

async function seedCourses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure ECE Department exists
    let eceDept = await Department.findOne({ shortName: 'ECE' });
    if (!eceDept) {
      console.log('ECE Department not found. Creating it...');
      eceDept = await Department.create({
        name: 'Electrical & Computer Engineering',
        shortName: 'ECE',
        establishedYear: 2023, // Default or adjust if known
        introduction: 'Department of Electrical & Computer Engineering at RUET.',
        hasSections: true,
        sectionCount: 2
      });
    }
    const deptId = eceDept._id;
    console.log(`Using Department: ${eceDept.name} (${deptId})`);

    // 2. Read ece-courses.json from root
    const jsonPath = path.join(__dirname, '..', 'ece-courses.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`File not found: ${jsonPath}`);
    }
    const coursesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Found ${coursesData.length} courses in JSON.`);

    // 3. Upsert courses
    let createdCount = 0;
    let updatedCount = 0;

    for (const data of coursesData) {
      const courseObj = {
        courseCode: data.courseCode,
        courseName: data.courseName,
        credit: data.credit,
        semester: data.semester,
        type: data.type,
        department: deptId,
        syllabus: data.syllabus
      };

      await Course.findOneAndUpdate(
        { courseCode: data.courseCode },
        { $set: courseObj },
        { upsert: true }
      );
      createdCount++; // Simple count since we are upserting
    }

    console.log(`Seeding complete: ${createdCount} created, ${updatedCount} updated.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  }
}

seedCourses();
