require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ruet_obe';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Find courses with the trailing " Semester" suffix
    const courses = await Course.find({ semester: { $regex: / Semester$/ } });
    console.log(`Found ${courses.length} courses to fix.`);

    let updated = 0;
    for (const course of courses) {
      const fixed = course.semester.replace(/ Semester$/, '');
      await Course.updateOne({ _id: course._id }, { $set: { semester: fixed } });
      updated++;
    }

    console.log(`✅ Updated ${updated} courses.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
