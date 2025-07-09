import express from "express";
import Feedback from "../models/feedback.js";
import { requireRole, requireRoles, verifyToken } from "../middleware/auth.js";
import faculty from "../models/faculty.js";

const router = express.Router();

// Submit feedback
router.post("/", verifyToken, requireRole("student"), async (req, res) => {
  try {
    const {
      student,
      faculty,
      course,
      batch,
      semester,
      questionRating,
      additionalComments,
    } = req.body;

    // Check if feedback already exists for this student-course combination
    const existing = await Feedback.findOne({
      student,
      course,
      batch,
      semester,
    });

    if (existing) {
      return res.status(400).json({
        error: "Feedback already submitted for this course",
      });
    }

    // Calculate score: (sum of ratings / 55) * 25
    const totalRating = questionRating.reduce(
      (sum, item) => sum + item.rating,
      0
    );
    const score = (totalRating / 55) * 25;

    console.log(
      `Score calculation: Total rating = ${totalRating}, Score = ${score.toFixed(
        2
      )}`
    );

    const feedback = new Feedback({
      student,
      faculty,
      course,
      batch,
      semester,
      questionRating,
      additionalComments,
      score,
    });

    await feedback.save();
    res.status(201).json({
      message: "Feedback Submitted Successfully",
      feedback,
      score,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get feedback by student
// router.get("/student/:studentId", async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     const feedback = await Feedback.find({ student: studentId })
//       .populate("faculty", "name designation")
//       .populate("course", "name code")
//       .sort({ createdAt: -1 });

//     res.json(feedback);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Get feedback by faculty
router.get("/faculty/:facultyId",verifyToken,requireRoles("admin", "faculty"),async (req, res) => {
    try {
      const { facultyId } = req.params;
      const feedbacks = await Feedback.find({ faculty: facultyId })
        .populate("course", "name code")
        .sort({ createdAt: -1 });

      res.json(feedbacks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// get avg score by faculty
router.get("/faculty/avg/:facultyId",verifyToken,requireRoles("admin", "faculty"),async (req, res) => {
    try {
      const { facultyId } = req.params;
      const feedbacks = await Feedback.find({ faculty: facultyId })
        .populate("course", "name code")
        .sort({ createdAt: -1 });

      if (feedbacks.length === 0) {
        return res.json({
          averageScore: 0,
          message: "No feedback found for this faculty",
        });
      }

      const avgScore =
        feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length;

      return res.json({
        averageScore: Math.round(avgScore * 100) / 100, // Round to 2 decimal places
      });
    } catch (error) {
      console.error("Error getting faculty average score:", error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// get avg ratings for questions
router.get("/faculty/ratings/:facultyId",verifyToken,requireRoles("admin", "faculty"),async (req, res) => {
    try {
      const { facultyId } = req.params;
      const feedbacks = await Feedback.find(
        { faculty: facultyId },
        { questionRating: 1 }
      )
        .populate("course", "name code")
        .sort({ createdAt: -1 });

      if (feedbacks.length === 0) {
        return res.json({
          ratings: [],
          questions: [],
          message: "No feedback found for this faculty",
        });
      }

      // Get question text from the first feedback (all feedbacks should have same questions)
      const questionTexts = feedbacks[0].questionRating.map((q) => q.question);

      // Calculate average ratings for each question
      const questionCount = feedbacks[0].questionRating.length; // Number of questions
      const ratings = [];

      for (let i = 0; i < questionCount; i++) {
        const totalRating = feedbacks.reduce((sum, feedback) => {
          return sum + (feedback.questionRating[i]?.rating || 0);
        }, 0);
        ratings[i] = totalRating / feedbacks.length;
      }

      console.log("Average ratings for faculty:", facultyId, ratings);

      res.json({
        ratings,
        questions: questionTexts,
      });
    } catch (error) {
      console.error("Error getting faculty ratings:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get faculty courses with ratings
router.get("/faculty/courses/:facultyId",verifyToken,requireRoles("admin", "faculty"),async (req, res) => {
    try {
      const { facultyId } = req.params;
      const feedbacks = await Feedback.find({ faculty: facultyId })
        .populate("course", "name code")
        .sort({ createdAt: -1 });

      if (feedbacks.length === 0) {
        return res.json({
          message: "No feedback found for this faculty",
        });
      }

      // Group feedbacks by course and calculate average ratings
      const courseRatings = {};
      const courseGroups = {};

      feedbacks.forEach((feedback) => {
        const courseId = feedback.course._id.toString();
        if (!courseGroups[courseId]) {
          courseGroups[courseId] = [];
        }
        courseGroups[courseId].push(feedback);
      });

      // Calculate average rating for each course
      Object.keys(courseGroups).forEach((courseId) => {
        const courseFeedbacks = courseGroups[courseId];
        const totalRating = courseFeedbacks.reduce((sum, feedback) => {
          const avgRating =
            feedback.questionRating.reduce((qSum, q) => qSum + q.rating, 0) /
            feedback.questionRating.length;
          return sum + avgRating;
        }, 0);
        courseRatings[courseId] = totalRating / courseFeedbacks.length;
      });

      res.json(courseRatings);
    } catch (error) {
      console.error("Error getting faculty course ratings:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get yearly performance data for faculty
router.get("/faculty/yearly/:facultyId",verifyToken,requireRoles("admin", "faculty"),async (req, res) => {
    try {
      const { facultyId } = req.params;
      const feedbacks = await Feedback.find({ faculty: facultyId }).sort({
        createdAt: -1,
      });

      if (feedbacks.length === 0) {
        return res.json({
          message: "No feedback found for this faculty",
        });
      }

      // Group feedbacks by year and calculate average scores
      const yearlyData = {};

      feedbacks.forEach((feedback) => {
        const year = new Date(feedback.createdAt).getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = [];
        }
        yearlyData[year].push(feedback.score);
      });

      // Calculate average score for each year
      const yearlyPerformance = {};
      Object.keys(yearlyData).forEach((year) => {
        const scores = yearlyData[year];
        const avgScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        yearlyPerformance[year] = Math.round(avgScore * 100) / 100; // Round to 2 decimal places
      });

      res.json(yearlyPerformance);
    } catch (error) {
      console.error("Error getting faculty yearly performance:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get feedback by course
// router.get("/course/:courseId", async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     const feedback = await Feedback.find({ course: courseId })
//       .populate("student", "name rollNumber")
//       .populate("faculty", "name designation")
//       .sort({ createdAt: -1 });

//     res.json(feedback);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Check if feedback already given for student-course combination
router.get("/check/:studentId/:courseId/:batch/:semester",verifyToken,requireRoles("student", "admin"),async (req, res) => {
    try {
      const { studentId, courseId, batch, semester } = req.params;

      const existingFeedback = await Feedback.findOne({
        student: studentId,
        course: courseId,
        batch,
        semester: parseInt(semester),
      });

      if (existingFeedback) {
        res.json({
          exists: true,
          message: "Feedback already given for this course",
          feedback: existingFeedback,
        });
      } else {
        res.json({
          exists: false,
          message: "No feedback given yet",
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all feedback (for admin)
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("student", "name rollNumber")
      .populate("faculty", "name designation")
      .populate("course", "name code")
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
