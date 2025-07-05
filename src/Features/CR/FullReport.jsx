import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import HODPart1Performance from "./HODPart1Performance";
import HODPart2Assessment from "./HODPart2Assessment";
import FacultyPart3Potential from "./FacultyPart3Potential";
import FacultyPart4Research from "./FacultyPart4Research";
import FacultySignatures from "./FacultySignatures";
import HODSignaturesPart1 from "./HODSignaturesPart1";
import HODSignaturesPart2 from "./HODSignaturesPart2";
import FacultyAttachments from "./FacultyAttachments";
export default function FullReport({ user }) {
  const { reportId } = useParams();
  const testFacultyForm = {
    // 5(a) - Subjects Taught
    subjectsTaught: [
      {
        subject: "Data Structures",
        contactHours: 45,
        studentsAppeared: 60,
        studentsPassed: 55,
        remarks: "Strong student engagement",
      },
      {
        subject: "Operating Systems",
        contactHours: 40,
        studentsAppeared: 58,
        studentsPassed: 50,
        remarks: "Improved performance",
      },
    ],

    // 5(b)
    examResults: "Pass percentage exceeded 85% for both subjects.",

    // 6 - Contributions
    labDevelopment: "Designed new OS lab experiments and manual.",
    modelsAndAids: "Developed visual aids for memory management.",
    shortCourses: "Conducted a short course on Linux System Programming.",

    // 7 - Research Guidance
    researchGuidance: {
      qualified: {
        phd: 1,
        mphil: 0,
        pg: 2,
      },
      registered: {
        phd: 1,
        pg: 1,
        pgDiploma: 0,
        ug: 2,
      },
    },

    // 7(c)
    papersPublished: [
      "Efficient Lock-Free Queue Implementation, IJCA, 2023",
      "Kernel Optimization for Embedded Systems, IEEE Access, 2024",
    ],

    // 7(d)
    researchInstruments: ["Raspberry Pi 4", "Jetson Nano", "BeagleBone Black"],

    // Optional/Additional
    additionalQualifications: [
      "NPTEL AI/ML Certification",
      "Coursera Cloud Fundamentals",
    ],

    booksOrGuides: [
      "Operating Systems Simplified, TechBooks 2022",
      "Hands-on with Linux, CodePress 2023",
    ],

    memberships: ["IEEE", "CSI", "ACM"],

    conferences: [
      "ICACSE 2024 - Presented on Hybrid Kernels",
      "ICCT 2023 - Panel Speaker on Microservices",
    ],

    consultingWork: [
      "Kernel optimization for TechEdge Pvt Ltd",
      "Linux performance audit for SoftServe",
    ],

    otherContributions: [
      "Organized CODEFEST 2024",
      "Conducted weekly technical seminars",
    ],

    pastoralFunctions: [
      "Mentor for 30 UG students",
      "Coordinated peer learning",
    ],

    attachments: [],

    // Optional metadata
    period: "2024-2025",
    status: "draft",

    // Signatures
    facultySignature: "",
    facultySignatureDate: "",

    // For HOD use (can be empty)
    hodPart1: {},
    hodPart2: {},
  };

  const [form, setForm] = useState({
    // 5(a) - Subjects Taught
    subjectsTaught: [],

    // 5(b) - Other exam related info
    examResults: "",

    // 6 - Contributions
    labDevelopment: "",
    modelsAndAids: "",
    shortCourses: "",

    // 7 - Research guidance
    researchGuidance: {
      qualified: { phd: 0, mphil: 0, pg: 0 }, // 7(a)
      registered: { phd: 0, pg: 0, pgDiploma: 0, ug: 0 }, // 7(b)
    },

    // 7(c) - Papers published
    papersPublished: [],

    // 7(d) - Instrumentation
    researchInstruments: [],

    // Extra academic/professional info (optional)
    memberships: [],
    booksOrGuides: [],
    conferences: [],
    consultingWork: [],
    additionalQualifications: [],
    pastoralFunctions: [],
    otherContributions: [],
    attachments: [],
    //period and status
    period: "",
    status: "",
    // Signatures & HOD Parts
    facultySignature: "",
    facultySignatureDate: "",
    hodPart1: {},
    hodPart2: {},
  });

  console.log(user.role, form.status);
  const [faculty, setFaculty] = useState({});
  const [fileUploads, setFileUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const isHOD = user?.role === "hod";
  const [odRequests, setOdRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/crreport/report/${reportId}`,
          {
            headers: { "x-user-email": user.email },
          }
        );
        const report = res.data;
        console.log("Fetched report:", report);

        setFaculty(report.faculty || {});

        // Inject test data for faculty section
        const mergedSelfAssessment = {
          subjectsTaught:
            report.selfAssessment?.subjectsTaught ??
            testFacultyForm.subjectsTaught,
          examResults:
            report.selfAssessment?.examResults ?? testFacultyForm.examResults,
          labDevelopment:
            report.selfAssessment?.labDevelopment ??
            testFacultyForm.labDevelopment,
          modelsAndAids:
            report.selfAssessment?.modelsAndAids ??
            testFacultyForm.modelsAndAids,
          shortCourses:
            report.selfAssessment?.shortCourses ?? testFacultyForm.shortCourses,
          researchGuidance:
            report.selfAssessment?.researchGuidance ??
            testFacultyForm.researchGuidance,
          papersPublished:
            report.selfAssessment?.papersPublished ??
            testFacultyForm.papersPublished,
          researchInstruments:
            report.selfAssessment?.researchInstruments ??
            testFacultyForm.researchInstruments,
          memberships:
            report.selfAssessment?.memberships ?? testFacultyForm.memberships,
          booksOrGuides:
            report.selfAssessment?.booksOrGuides ??
            testFacultyForm.booksOrGuides,
          conferences:
            report.selfAssessment?.conferences ?? testFacultyForm.conferences,
          consultingWork:
            report.selfAssessment?.consultingWork ??
            testFacultyForm.consultingWork,
          additionalQualifications:
            report.selfAssessment?.additionalQualifications ??
            testFacultyForm.additionalQualifications,
          pastoralFunctions:
            report.selfAssessment?.pastoralFunctions ??
            testFacultyForm.pastoralFunctions,
          otherContributions:
            report.selfAssessment?.otherContributions ??
            testFacultyForm.otherContributions,
          attachments:
            report.selfAssessment?.attachments ?? testFacultyForm.attachments,
        };

        setForm((prev) => ({
          ...prev,
          ...mergedSelfAssessment,
          hodPart1: report.hodSection?.performance ?? testFacultyForm.hodPart1,
          hodPart2: report.hodSection?.potential ?? testFacultyForm.hodPart2,
          period: report.period ?? testFacultyForm.period,
          year: report.year ?? testFacultyForm.year,
          status: report.status ?? testFacultyForm.status,
          facultySignature:
            report.facultySignature ?? testFacultyForm.facultySignature,
          facultySignatureDate:
            report.facultySignatureDate ?? testFacultyForm.facultySignatureDate,
        }));
      } catch (err) {
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId, user]);

  useEffect(() => {
    async function fetchOD() {
      try {
        const api = `http://localhost:5000/api/odrequests/user/${user.userId}`;
        const res = await axios.get(api, {
          headers: { "x-user-email": user.email },
        });
        setOdRequests(res.data || []);
        console.log("Fetched OD requests:", res.data);
        res.data.forEach(r => {
          console.log("OD request:", r._id, "startDate:", r.startDate, "eventType:", r.eventType);
        });
      } catch {
        setOdRequests([]);
        console.log("Failed to fetch OD requests");
      }
    }
    if (user?.userId) fetchOD();
  }, [user]);

  // Filter OD requests by period/year if needed
  const year = form.year || new Date().getFullYear();
  const period = form.period || "december";
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);
  const periodStart = start;
  const periodEnd = period === "june" ? new Date(`${year}-06-30`) : end;
  console.log("periodStart", periodStart, "periodEnd", periodEnd);
  // Robust, case-insensitive filtering
  const filteredOD = odRequests.filter(r => {
    if (!r.eventType) return false;
    // Uncomment the next two lines to test without date filtering:
    // return true;
    const s = new Date(r.startDate);
    return s >= periodStart && s <= periodEnd;
  });
  const odConferences = filteredOD.filter(
    r => r.eventType && ["conference", "workshop"].includes(r.eventType.toLowerCase())
  );
  const odOther = filteredOD.filter(
    r =>
      r.eventType &&
      !["conference", "workshop"].includes(
        r.eventType.toLowerCase()
      )
  );
  console.log("filteredOD", filteredOD);
  console.log("odConferences", odConferences);
  console.log("odOther", odOther);

  const handleFinalize = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/crreport/${reportId}/finalize`,
        {},
        { headers: { "x-user-email": user.email } }
      );
      toast.success("Report finalized");
    } catch (err) {
      toast.error("Failed to finalize report");
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();

    const isFaculty = user.role === "faculty";
    const isHOD = user.role === "hod";

    // Faculty validation
    if (isFaculty) {
      const facultySigMissing =
        !form.facultySignature?.trim() || !form.facultySignatureDate?.trim();
      const hodPart1Missing =
        !form.hodPart1?.performanceAssessmentSignature?.faculty?.name ||
        !form.hodPart1?.performanceAssessmentSignature?.faculty?.date;
      const hodPart2Missing =
        !form.hodPart2?.potentialAssessmentSignature?.faculty?.name ||
        !form.hodPart2?.potentialAssessmentSignature?.faculty?.date;

      if (facultySigMissing || hodPart1Missing || hodPart2Missing) {
        toast.error(
          "Faculty signature and both HOD section faculty signatures are required before submission."
        );
        return;
      }
    }

    // HOD validation
    if (isHOD) {
      const hodPart1SigMissing =
        !form.hodPart1?.performanceAssessmentSignature?.hod?.name ||
        !form.hodPart1?.performanceAssessmentSignature?.hod?.date;
      const hodPart2SigMissing =
        !form.hodPart2?.potentialAssessmentSignature?.hod?.name ||
        !form.hodPart2?.potentialAssessmentSignature?.hod?.date;

      if (hodPart1SigMissing || hodPart2SigMissing) {
        toast.error(
          "Please provide HOD signatures in both Part I and Part II before finalizing."
        );
        return;
      }
    }

    try {
      let updatedAttachments = [...form.attachments];

      if (isFaculty && form.attachments?.length > 0) {
        const newFiles = form.attachments.filter((f) => f.file); // Only new ones
        if (newFiles.length > 0) {
          const formData = new FormData();
          newFiles.forEach((f) => formData.append("attachments", f.file));

          const uploadRes = await axios.post(
            `http://localhost:5000/api/crreport/${reportId}/self-assessment/attachments`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                "x-user-email": user.email,
              },
            }
          );

          const uploaded = uploadRes.data?.selfAssessment?.attachments || [];

          // Merge new + old (excluding unuploaded files)
          updatedAttachments = [
            ...form.attachments.filter((f) => !f.file),
            ...uploaded,
          ];
        }
      }

      // Build self-assessment payload cleanly
      const selfAssessmentOnly = {
        subjectsTaught: form.subjectsTaught,
        examResults: form.examResults,
        labDevelopment: form.labDevelopment,
        modelsAndAids: form.modelsAndAids,
        shortCourses: form.shortCourses,
        researchGuidance: form.researchGuidance,
        papersPublished: form.papersPublished,
        researchInstruments: form.researchInstruments,
        memberships: form.memberships,
        booksOrGuides: form.booksOrGuides,
        conferences: form.conferences,
        consultingWork: form.consultingWork,
        additionalQualifications: form.additionalQualifications,
        pastoralFunctions: form.pastoralFunctions,
        otherContributions: form.otherContributions,
        // attachments: updatedAttachments,
      };
      console.log(form,selfAssessmentOnly)
      await axios.patch(
        `http://localhost:5000/api/crreport/${reportId}/update-full`,
        {
          selfAssessment: selfAssessmentOnly,
          hodSection: {
            performance: form.hodPart1,
            potential: form.hodPart2,
          },
          status: isFaculty ? "faculty-filled" : form.status || "draft",
          period: form.period,
          facultySignature: form.facultySignature,
          facultySignatureDate: form.facultySignatureDate,
        },
        {
          headers: { "x-user-email": user.email },
        }
      );

      toast.success("CR Report saved successfully");

      if (isHOD) {
        await handleFinalize();
      }
    } catch (err) {
      console.error("Error saving CR report:", err);
      toast.error("Submission failed");
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-5xl mx-auto bg-white p-6 rounded shadow space-y-6"
    >
      <h2 className="text-2xl font-bold text-center text-[#145DA0] mb-4">
        Confidential Report (CR) Full Report
      </h2>

      <div className="space-y-2 border p-4 rounded text-sm">
        <div>
          <strong>Name:</strong> {faculty.name}
        </div>
        <div>
          <strong>DOB:</strong>{" "}
          {faculty.dob && new Date(faculty.dob).toLocaleDateString()}
        </div>
        <div>
          <strong>Designation:</strong> {faculty.designation}
        </div>
        <div>
          <strong>Department:</strong> {faculty.department}
        </div>
        <div>
          <strong>Scale of Pay / Present Pay:</strong> {faculty.scaleOfPay} /{" "}
          {faculty.presentPay}
        </div>
        <div>
          <strong>Post Held & Appointment Type:</strong> {faculty.postHeld}
        </div>
      </div>

      {/* Part I: Performance Assessment */}
      <HODPart1Performance
        data={{ ...form.hodPart1, faculty }}
        onChange={(key, value) =>
          setForm((prev) => ({
            ...prev,
            hodPart1: {
              ...prev.hodPart1,
              [key]: value,
            },
          }))
        }
        readOnly={!isHOD || form.status !== "faculty-filled"}
      />
      <HODSignaturesPart1 form={form} setForm={setForm} user={user} />

      {/* Part II: Potential Assessment */}
      <HODPart2Assessment
        data={form.hodPart2}
        onChange={(key, value) =>
          setForm((prev) => ({
            ...prev,
            hodPart2: {
              ...prev.hodPart2,
              [key]: value,
            },
          }))
        }
        readOnly={!isHOD || form.status !== "faculty-filled"}
      />

      <HODSignaturesPart2 form={form} setForm={setForm} user={user} />

      {/* Part III: Faculty Self-Assessment */}
      <FacultyPart3Potential
        form={form}
        setForm={setForm}
        user={user}
        faculty={faculty}
        readOnly={user.role !== "faculty" || form.status !== "draft"}
      />

      {/* Part IV: Faculty Research */}
      <FacultyPart4Research
        form={form}
        setForm={setForm}
        fileUploads={fileUploads}
        setFileUploads={setFileUploads}
        readOnly={user.role !== "faculty" || form.status !== "draft"}
        odConferences={odConferences}
        odOther={odOther}
      />
      {user.role === "faculty" &&  (
        <FacultyAttachments form={form} setForm={setForm} readOnly={form.status !== "draft"} />
      )}
      {user.role !== "faculty" &&  (
        <FacultyAttachments form={form} setForm={setForm} readOnly={true} />
      )}
      <FacultySignatures form={form} setForm={setForm} user={user} />

      {user.role === "faculty" && form.status === "draft" && (
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded font-semibold mt-4"
        >
          Submit CR Report
        </button>
      )}

      {user.role === "hod" && form.status === "faculty-filled" && (
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold mt-4"
        >
          Finalize Report
        </button>
      )}
    </form>
  );
}
