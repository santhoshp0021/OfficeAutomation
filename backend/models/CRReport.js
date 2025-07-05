const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  filename: String,
  url: String,
});

const selfAssessmentSchema = new mongoose.Schema({
  subjectsTaught: [
    {
      subject: String,
      contactHours: Number,
      studentsAppeared: Number,
      studentsPassed: Number,
      remarks: String,
    },
  ],
  examResults: String, // 5(b)

  // 6. Contributions
  labDevelopment: String,
  modelsAndAids: String,
  shortCourses: String,

  // 7. Research Guidance
  researchGuidance: {
    qualified: {
      phd: { type: Number, default: 0 }, // 7(a)
      mphil: { type: Number, default: 0 },
      pg: { type: Number, default: 0 },
    },
    registered: {
      phd: { type: Number, default: 0 }, // 7(b)
      pg: { type: Number, default: 0 },
      pgDiploma: { type: Number, default: 0 },
      ug: { type: Number, default: 0 },
    },
  },

  papersPublished: [String], // 7(c)
  researchInstruments: [String], // 7(d)

  additionalQualifications: [String],
  booksOrGuides: [String],
  memberships: [String],
  conferences: [String],
  consultingWork: [String],
  otherContributions: [String],
  pastoralFunctions: [String],
  attachments: [attachmentSchema], 
});

const hodSectionSchema = new mongoose.Schema({
  performance: {
    controlClass: String,
    studentCounseling: String,
    avgPassPercentage: String,
    classRecords: String,
    contributions: String,
    researchAbility: String,
    professionalStanding: String,
    extraCurricular: String,
    willingness: String,
    lapses: String,
    overallRating: String,
    performanceAssessmentSignature: {
    hod: {
      name: String,
      date: Date,
    },
    reviewingOfficer: {
      name: String,
      date: Date,
    },
    faculty: {
      name: String,
      date: Date,
    },
  },
  },
  potential: {
    physicalCapacity: String,
    stability: String,
    mentalCapacity: String,
    aptitude: String,
    abilityToManage: String,
    getAlong: String,
    academicLeadership: String,
    generalAppraisal: String,
    specialRemarks: String,
    fitness: String,
    potentialAssessmentSignature: {
    hod: {
      name: String,
      date: Date,
    },
    faculty: {
      name: String,
      date: Date,
    },
  },
  },
  
});

const CRReportSchema = new mongoose.Schema({
  faculty: {
    facultyId: { type: String, required: true },
    name: String,
    dob: Date,
    qualifications: String,
    designation: String,
    scaleOfPay: String,
    presentPay: String,
    postHeld: String,
    department: String,
    dateOfJoining: Date,
  },
  year: String,
  period: String,
  status: {
    type: String,
    enum: ["draft", "faculty-filled", "hod-signed", "finalized"],
    default: "draft",
  },
  selfAssessment: selfAssessmentSchema,
  hodSection: hodSectionSchema,
  facultySignature: String, // Faculty's name as signature
  facultySignatureDate: Date,
  hodSignDate: Date,
  // attachments: [attachmentSchema],
  intermediateOfficerRemarks: String,
  intermediateOfficerSignature: {
    name: String,
    designation: String,
    date: Date,
    signatureImage: String,
  },
  facultyAcknowledgement: {
    remarks: String,
    date: Date,
    signatureImage: String,
  },
});

module.exports = mongoose.model("CRReport", CRReportSchema);
