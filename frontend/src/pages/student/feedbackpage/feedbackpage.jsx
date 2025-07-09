import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import backgroundImage from "../../../assests/Red_Building_Cropped.jpg";
import HeaderBar from "../../../components/HeaderBar";
import FooterBar from "../../../components/FooterBar";
import { useAuth } from "../../../contexts/AuthContext";
import { apiFetch } from '../../../utils/api';

// Styled components
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  position: relative;
  display: flex;
  justify-content: center;
  padding: 2rem;
  padding-top: 6rem;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url(${backgroundImage});
    background-size: cover;
    background-position: center;
    filter: blur(4px);
    z-index: -2;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: -1;
  }
`;

const Container = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.5s ease-out;
  backdrop-filter: blur(10px);
`;

const Title = styled.h1`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #34495e;
  font-weight: 600;
  font-size: 1.1rem;
`;

const RatingContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }

  svg {
    width: 2rem;
    height: 2rem;
    color: ${(props) => (props.selected ? "#f1c40f" : "#bdc3c7")};
    transition: color 0.2s ease;
  }

  &:hover svg {
    color: #f1c40f;
  }
`;

const TextArea = styled.textarea`
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: border-color 0.3s ease;
  background: rgba(255, 255, 255, 0.9);

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const SubmitButton = styled(motion.button)`
  background: #3498db;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FacultyInfo = styled.div`
  background: #e3f2fd;
  padding: 12px;
  border-radius: 8px;
  margin-top: 8px;
  border-left: 4px solid #2196f3;
`;

const FeedbackPage = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    course: null,
    faculty: null,
    questionRating: [
      {
        question:
          "Has the faculty covered entire syllabus prescribed by CSVTU/DTE/College Board?",
        rating: 0,
      },
      {
        question: "Has the faculty covered relevant topics beyond syllabus?",
        rating: 0,
      },
      {
        question:
          "Effectiveness of faculty in terms of (i) Technical/Course content",
        rating: 0,
      },
      {
        question: " (ii) Communication skills",
        rating: 0,
      },
      {
        question: "(iii) Use of teaching aids",
        rating: 0,
      },
      {
        question: "Pace at which the course content covered",
        rating: 0,
      },
      {
        question: "Motivation and inspiration for students to learn",
        rating: 0,
      },
      {
        question: "Practical demonstration",
        rating: 0,
      },
      {
        question: "Hands on training",
        rating: 0,
      },
      {
        question: "Clarity of expectations of students",
        rating: 0,
      },
      {
        question: "Willingness to offer advice and help to students",
        rating: 0,
      },
    ],
    additionalComments: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseFacultyMapping, setCourseFacultyMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState({});

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(
          `http://localhost:5000/api/assignments/semester/${currentUser?.current_semester}/batch/${currentUser?.batch}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }

        const data = await response.json();
        // console.log("Assignments data:", data);

        // Create course-faculty mapping
        const mapping = {};
        const courseList = [];

        data.forEach((assignment) => {
          if (assignment.course && assignment.faculty) {
            mapping[assignment.course._id] = assignment.faculty;
            courseList.push(assignment.course);
          }
        });

        setCourseFacultyMapping(mapping);
        setCourses(courseList);

        // Fetch elective assignments
        const electiveResponse = await apiFetch(
          `http://localhost:5000/api/elective-student-assignments/student/${currentUser?.id}`
        );

        if (!electiveResponse.ok) {
          throw new Error("Failed to fetch elective assignments");
        }

        const electiveData = await electiveResponse.json();
        // Gather all {electiveCourse, batch} pairs
        const electivePairs = electiveData.flatMap((assignment) =>
          assignment.electives.map((elective) => ({
            course: elective.electiveCourse,
            batch: elective.batch,
          }))
        );

        // Fetch faculty for each elective course+batch
        const electiveWithFaculty = await Promise.all(
          electivePairs.map(async ({ course, batch }) => {
            if (!course || !batch) return null;
            const res = await apiFetch(
              `http://localhost:5000/api/electiveCourseFacultyAssignment/electiveCourse/${course._id}/batch/${batch}`
            );
            if (!res.ok) throw new Error("Faculties not getting");
            const data = await res.json();
            // data is an array, take the first assignment (if any)
            const faculty = data[0]?.faculty || null;
            return faculty
              ? { course, faculty, isElective: true, batch }
              : null;
          })
        );
        // Remove nulls
        const validElectiveAssignments = electiveWithFaculty.filter(Boolean);
        // Combine with regular courses
        const combinedCourses = [
          ...courseList.map((c) => ({ ...c, isElective: false })),
          ...validElectiveAssignments.map((e) => ({
            ...e.course,
            isElective: true,
            batch: e.batch,
          })),
        ];

        const combinedMapping = { ...mapping };
        validElectiveAssignments.forEach((e) => {
          if (e.course && e.faculty) {
            combinedMapping[e.course._id] = e.faculty;
          }
        });
        setCourses(combinedCourses);
        setCourseFacultyMapping(combinedMapping);

        // Check feedback status for each course
        const statusMap = {};
        for (const course of combinedCourses) {
          try {
            const studentId = currentUser?.studentRef || currentUser?._id;
            const feedbackResponse = await apiFetch(
              `http://localhost:5000/api/feedback/check/${studentId}/${course._id}/${course?.batch || currentUser?.batch}/${currentUser?.current_semester}`
            );
            if (feedbackResponse.ok) {
              const feedbackData = await feedbackResponse.json();
              statusMap[course._id] = feedbackData.exists;
            }
          } catch (error) {
            console.error(
              `Error checking feedback for course ${course._id}:`,
              error
            );
            statusMap[course._id] = false;
          }
        }
        setFeedbackStatus(statusMap);

        const isFeedbackGiven = Object.values(statusMap).every(
          (s) => s === true
        );

        if (isFeedbackGiven && combinedCourses.length > 0) {
          try {
            console.log("Attempting to update student feedback status...");
            console.log(
              "Current user ID:",
              currentUser?.studentRef || currentUser?._id
            );
            console.log("Current user object:", currentUser);

            const studentId = currentUser?.studentRef || currentUser?._id;

            if (!studentId) {
              console.error("No valid student ID found");
              return;
            }

            const response = await apiFetch(
              `http://localhost:5000/api/students/${studentId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ isFeedbackGiven: true }),
              }
            );

            if (response.ok) {
              const result = await response.json();
              console.log("Updated the feedback given data in db:", result);
              // Update the current user context
              currentUser.isFeedbackGiven = true;
            } else {
              const errorData = await response.json();
              console.error(
                "Failed to update student feedback status:",
                errorData
              );
            }
          } catch (error) {
            console.error("Error updating student feedback status:", error);
          }
        }

        // Set default course and faculty if available
        if (combinedCourses.length > 0) {
          const defaultCourse = combinedCourses[0];
          const defaultFaculty = combinedMapping[defaultCourse._id];

          setFormData((prev) => ({
            ...prev,
            course: defaultCourse,
            faculty: defaultFaculty,
          }));
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setError("Failed to load course assignments. Please try again later.");
        toast.error("Failed to load course assignments");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.current_semester && currentUser?.batch) {
      fetchAssignments();
    }
  }, [currentUser]);

  console.log("form data ", formData);

  const handleCourseChange = (courseId) => {
    const selectedCourse = courses.find((course) => course._id === courseId);
    const assignedFaculty = courseFacultyMapping[courseId];

    setFormData((prev) => ({
      ...prev,
      course: selectedCourse,
      faculty: assignedFaculty,
      // Reset ratings when course changes
      questionRating: prev.questionRating.map((item) => ({
        ...item,
        rating: 0,
      })),
      additionalComments: "",
    }));
  };

  const handleRatingChange = (questionIndex, rating) => {
    setFormData((prev) => ({
      ...prev,
      questionRating: prev.questionRating.map((item, index) =>
        index === questionIndex ? { ...item, rating } : item
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.course || !formData.faculty) {
      toast.error("Please select a course");
      return;
    }

    // Check if all questions have ratings
    const hasAllRatings = formData.questionRating.every(
      (item) => item.rating > 0
    );
    if (!hasAllRatings) {
      toast.error("Please provide ratings for all questions");
      return;
    }

    // Check if feedback already given for this course
    if (feedbackStatus[formData.course._id]) {
      toast.error("Feedback already given for this course");
      return;
    }

    setIsSubmitting(true);

    try {
      const studentId = currentUser?.studentRef || currentUser?._id;
      const response = await apiFetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student: studentId,
          faculty: formData.faculty._id,
          course: formData.course._id,
          batch: String(formData.course.batch || currentUser.batch),
          semester: currentUser.current_semester,
          questionRating: formData.questionRating,
          additionalComments: formData.additionalComments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit feedback");
      }

      const result = await response.json();
      console.log("Feedback submitted:", result);
      toast.success("Feedback submitted successfully!");

      // Update feedback status for this course
      setFeedbackStatus((prev) => ({
        ...prev,
        [formData.course._id]: true,
      }));

      // Check if all feedback is now given
      const updatedStatus = {
        ...feedbackStatus,
        [formData.course._id]: true,
      };

      const allFeedbackGiven = Object.values(updatedStatus).every(
        (status) => status === true
      );

      if (allFeedbackGiven) {
        try {
          console.log("All feedback completed, updating student status...");
          const updateResponse = await apiFetch(
            `http://localhost:5000/api/students/${studentId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ isFeedbackGiven: true }),
            }
          );

          if (updateResponse.ok) {
            const result = await updateResponse.json();
            console.log(
              "Updated student feedback status to completed:",
              result
            );
            currentUser.isFeedbackGiven = true;
          } else {
            const errorData = await updateResponse.json();
            console.error(
              "Failed to update student feedback status:",
              errorData
            );
          }
        } catch (error) {
          console.error("Error updating student feedback status:", error);
        }
      }

      // Reset form
      setFormData({
        course: courses[0] || null,
        faculty: courses[0] ? courseFacultyMapping[courses[0]._id] : null,
        questionRating: formData.questionRating.map((item) => ({
          ...item,
          rating: 0,
        })),
        additionalComments: "",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(
        error.message || "Failed to submit feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderBar />
        <PageContainer>
          <Container>
            <Title>Course Feedback Form</Title>
            <div style={{ textAlign: "center", padding: "2rem" }}>
              Loading course assignments...
            </div>
          </Container>
        </PageContainer>
        <FooterBar />
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeaderBar />
        <PageContainer>
          <Container>
            <Title>Course Feedback Form</Title>
            <div
              style={{ textAlign: "center", padding: "2rem", color: "#e74c3c" }}
            >
              {error}
            </div>
          </Container>
        </PageContainer>
        <FooterBar />
      </>
    );
  }

  if (courses.length === 0) {
    return (
      <>
        <HeaderBar />
        <PageContainer>
          <Container>
            <Title>Course Feedback Form</Title>
            <div style={{ textAlign: "center", padding: "2rem" }}>
              No courses assigned for your semester and batch.
            </div>
          </Container>
        </PageContainer>
        <FooterBar />
      </>
    );
  }

  // Check if all feedback is given (only after loading is complete)
  const allFeedbackGiven =
    !loading &&
    Object.values(feedbackStatus).every((status) => status === true) &&
    courses.length > 0;

  if (allFeedbackGiven) {
    return (
      <>
        <HeaderBar />
        <PageContainer>
          <Container>
            <Title>Course Feedback Form</Title>
            <div
              style={{
                background: "#e8f5e8",
                padding: "15px",
                borderRadius: "8px",
                border: "2px solid #4caf50",
                textAlign: "center",
                color: "#2e7d32",
                fontWeight: "bold",
              }}
            >
              ✓ You have given feedback for all the courses!
            </div>
          </Container>
        </PageContainer>
        <FooterBar />
      </>
    );
  }

  return (
    <>
      <HeaderBar />
      <PageContainer>
        <Container>
          <Title>Course Feedback Form</Title>
          <Form onSubmit={handleSubmit}>
            <FormGroup
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Label>Course Name</Label>
              <select
                name="courseName"
                value={formData.course?._id || ""}
                onChange={(e) => handleCourseChange(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  width: "100%",
                  outline: "none",
                  backgroundColor: "white",
                  color: "black",
                  fontSize: "16px",
                  textAlign: "center",
                  textTransform: "uppercase",
                }}
                required
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name} {course.isElective ? "(Elective)" : ""}{" "}
                    {feedbackStatus[course._id] ? "(Feedback Given)" : ""}
                  </option>
                ))}
              </select>
            </FormGroup>

            {formData.course && formData.faculty && (
              <FormGroup
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Label>Faculty Name</Label>
                <FacultyInfo>
                  <strong>{formData.faculty.name}</strong>
                  <br />
                  <small>{formData.faculty.designation}</small>
                </FacultyInfo>
              </FormGroup>
            )}

            {formData.course &&
              formData.faculty &&
              feedbackStatus[formData.course._id] && (
                <FormGroup
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div
                    style={{
                      background: "#e8f5e8",
                      padding: "15px",
                      borderRadius: "8px",
                      border: "2px solid #4caf50",
                      textAlign: "center",
                      color: "#2e7d32",
                      fontWeight: "bold",
                    }}
                  >
                    ✓ Feedback already given for this course
                  </div>
                </FormGroup>
              )}

            {formData.course &&
              formData.faculty &&
              !feedbackStatus[formData.course._id] && (
                <>
                  {formData.questionRating.map((question, index) => (
                    <FormGroup
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * (index + 2) }}
                    >
                      <Label>{question.question}</Label>
                      <RatingContainer>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <StarButton
                            key={rating}
                            type="button"
                            selected={question.rating >= rating}
                            onClick={() => handleRatingChange(index, rating)}
                          >
                            <FaStar />
                          </StarButton>
                        ))}
                      </RatingContainer>
                    </FormGroup>
                  ))}

                  <FormGroup
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <Label>Additional Comments</Label>
                    <TextArea
                      value={formData.additionalComments}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          additionalComments: e.target.value,
                        }))
                      }
                      placeholder="Share your thoughts and suggestions..."
                    />
                  </FormGroup>

                  <SubmitButton
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  </SubmitButton>
                </>
              )}
          </Form>
        </Container>
      </PageContainer>
      <FooterBar />
    </>
  );
};

export default FeedbackPage;
