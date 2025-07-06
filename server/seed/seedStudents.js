const mongoose = require('mongoose');
const Student = require('../models/Student');

// Update this with your MongoDB connection string
const MONGO_URI = 'mongodb://localhost:27017/exam-management';

const students = [
  // CSE
  ...Array.from({ length: 7 }, (_, i) => ({
    regNo: `220010000${i + 1}`,
    name: `CSE Student ${i + 1}`,
    branch: "CSE",
    exams: [
      { date: "04-DEC-24", session: "FN", courseCode: "CP3351", courseName: "CYBER" },
      { date: "06-DEC-24", session: "FN", courseCode: "CP3061", courseName: "DEVOPS" },
      { date: "09-DEC-24", session: "FN", courseCode: "CP3064", courseName: "FST" },
      { date: "11-DEC-24", session: "FN", courseCode: "CP3079", courseName: "UI DESIGN" }
    ]
  })),
  // CSE BDA
  ...Array.from({ length: 7 }, (_, i) => ({
    regNo: `220020000${i + 1}`,
    name: `CSE BDA Student ${i + 1}`,
    branch: "CSE BDA",
    exams: [
      { date: "04-DEC-24", session: "FN", courseCode: "CP3351", courseName: "CYBER" },
      { date: "06-DEC-24", session: "FN", courseCode: "CP3061", courseName: "DEVOPS" },
      { date: "09-DEC-24", session: "FN", courseCode: "CP3064", courseName: "FST" },
      { date: "11-DEC-24", session: "FN", courseCode: "CP3079", courseName: "UI DESIGN" }
    ]
  })),
  // CSE OR
  ...Array.from({ length: 7 }, (_, i) => ({
    regNo: `220030000${i + 1}`,
    name: `CSE OR Student ${i + 1}`,
    branch: "CSE OR",
    exams: [
      { date: "04-DEC-24", session: "FN", courseCode: "CP3058", courseName: "DATA WAREHOUSING" },
      { date: "06-DEC-24", session: "FN", courseCode: "OR3301", courseName: "DP" },
      { date: "11-DEC-24", session: "FN", courseCode: "OR3003", courseName: "PERT/CPM" },
      { date: "13-DEC-24", session: "FN", courseCode: "OR3005", courseName: "SUPPLY CHAIN" }
    ]
  })),
  // SE
  ...Array.from({ length: 7 }, (_, i) => ({
    regNo: `220040000${i + 1}`,
    name: `SE Student ${i + 1}`,
    branch: "SE",
    exams: [
      { date: "04-DEC-24", session: "FN", courseCode: "CP3351", courseName: "CYBER" },
      { date: "06-DEC-24", session: "FN", courseCode: "CP3061", courseName: "DEVOPS" },
      { date: "09-DEC-24", session: "FN", courseCode: "CP3064", courseName: "FST" },
      { date: "11-DEC-24", session: "FN", courseCode: "CP3079", courseName: "UI DESIGN" }
    ]
  })),
  // Ph.D
  ...Array.from({ length: 7 }, (_, i) => ({
    regNo: `220050000${i + 1}`,
    name: `Ph.D Student ${i + 1}`,
    branch: "Ph.D",
    exams: [
      { date: "04-DEC-24", session: "FN", courseCode: "CP3351", courseName: "CYBER" },
      { date: "09-DEC-24", session: "FN", courseCode: "CP3064", courseName: "FST" }
    ]
  }))
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await Student.deleteMany({});
    await Student.insertMany(students);
    console.log('Students seeded successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed(); 