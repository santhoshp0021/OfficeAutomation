import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaExclamationCircle } from "react-icons/fa";
import backgroundImage from "../../../assests/Red_Building_Cropped.jpg";
import HeaderBar from "../../../components/HeaderBar";
import FooterBar from "../../../components/FooterBar";
import { useAuth } from "../../../contexts/AuthContext";
import { apiFetch } from '../../../utils/api';
// Animations
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
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
    filter: blur(4px) brightness(0.8);
    z-index: -2;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: -1;
  }
`;

const Container = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.6s ease-out;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  color: #e74c3c;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  svg {
    animation: ${pulse} 2s infinite;
  }
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
  color: #2c3e50;
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #e74c3c;
  }
`;

const Select = styled.select`
  padding: 12px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  width: 100%;
  outline: none;
  background-color: white;
  color: #2c3e50;
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    border-color: #e74c3c;
    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.1);
  }

  option {
    padding: 10px;
  }
`;

const TextArea = styled.textarea`
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  
  &:focus {
    outline: none;
    border-color: #e74c3c;
    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.1);
  }

  &::placeholder {
    color: #95a5a6;
  }
`;

const SubmitButton = styled(motion.button)`
  background: #e74c3c;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: #c0392b;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    font-size: 1.2rem;
  }
`;

const GrievancePage = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    description: "",
    department: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // useEffect(() => {
  //   const fetchAssignments = async () => {
  //     try {
  //       setLoading(true);
  //       setError("");

  //       // Fetch course assignments for the student
  //       const response = await fetch(
  //         `http://localhost:5000/api/assignments/semester/${currentUser.current_semester}/batch/${currentUser.batch}`
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch course assignments");
  //       }

  //       const assignments = await response.json();
  //       console.log("Course assignments:", assignments);

  //       // Extract unique courses and create faculty mapping
  //       const uniqueCourses = [];
  //       const facultyMapping = {};

  //       assignments.forEach((assignment) => {
  //         const courseId = assignment.course._id;
  //         if (!uniqueCourses.find((c) => c._id === courseId)) {
  //           uniqueCourses.push(assignment.course);
  //         }
  //         facultyMapping[courseId] = assignment.faculty;
  //       });

  //       setCourses(uniqueCourses);
  //       setCourseFacultyMapping(facultyMapping);
  //     } catch (error) {
  //       console.error("Error fetching assignments:", error);
  //       setError("Failed to load course assignments. Please try again later.");
  //       toast.error("Failed to load course assignments");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (currentUser?.current_semester && currentUser?.batch) {
  //     fetchAssignments();
  //   }
  // }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const studentId = currentUser?.studentRef || currentUser?._id;
      
      const response = await apiFetch("http://localhost:5000/api/grievances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student: studentId,
          faculty: null, // Can be null for general grievances
          course: null, // Can be null for general grievances
          batch: currentUser.batch,
          semester: currentUser.current_semester,
          category: formData.category,
          subject: formData.subject,
          grievanceText: formData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit grievance");
      }

      const result = await response.json();
      console.log("Grievance submitted:", result);
      toast.success("Grievance submitted successfully!");
      
      // Reset form
      setFormData({
        category: "",
        subject: "",
        description: "",
        department: "",
      });
    } catch (error) {
      console.error("Error submitting grievance:", error);
      toast.error(
        error.message || "Failed to submit grievance. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    "Academic",
    "Administrative",
    "Infrastructure",
    "Hostel",
    "Other"
  ];

  // const departments = [
  //   "Computer Science",
  //   "Electrical Engineering",
  //   "Mechanical Engineering",
  //   "Civil Engineering",
  //   "Administration"
  // ];

  return (
    <>
    <HeaderBar />
    <PageContainer>
      <Container>
        <Title>
          <FaExclamationCircle />
          Submit Grievance
        </Title>
        
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            Loading...
          </div>
        )}

        {error && (
          <div style={{ 
            textAlign: "center", 
            padding: "2rem", 
            color: "#e74c3c",
            background: "#fdf2f2",
            borderRadius: "8px",
            marginBottom: "1rem"
          }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <Form onSubmit={handleSubmit}>
            <FormGroup
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Label>
                <FaExclamationCircle />
                Category
              </Label>
              <Select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Label>
                <FaExclamationCircle />
                Subject
              </Label>
              <TextArea
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Brief description of your grievance"
                required
              />
            </FormGroup>

            <FormGroup
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Label>
                <FaExclamationCircle />
                Detailed Description
              </Label>
              <TextArea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Please provide detailed information about your grievance..."
                required
              />
            </FormGroup>

            <SubmitButton
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaExclamationCircle />
              {isSubmitting ? "Submitting..." : "Submit Grievance"}
            </SubmitButton>
          </Form>
        )}
      </Container>
    </PageContainer>
    <FooterBar />
    </>
  );
};

export default GrievancePage;
