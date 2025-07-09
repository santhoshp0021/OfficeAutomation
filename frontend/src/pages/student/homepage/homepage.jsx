import React, { useEffect } from "react";
import HeaderBar from "../../../components/HeaderBar";
import GreetingSection from "../../../components/GreetingSection";
import FormsSection from "../../../components/FormsSection";
import FooterBar from "../../../components/FooterBar";
import styles from "./homepage.module.css";
import { useAuth } from "../../../contexts/AuthContext";

const Homepage = () =>{
  const { currentUser } = useAuth();
  function calculateSemester(joinYear) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-based month
  
    // Treat July of join year as semester 1
    const joinStart = new Date(joinYear, 6); // July = month 6 (0-based)
    const monthsElapsed =
      (now.getFullYear() - joinStart.getFullYear()) * 12 +
      (now.getMonth() - joinStart.getMonth());
  
    // Every 6 months = 1 semester
    const semester = Math.floor(monthsElapsed / 6) + 1;
  
    return semester; // cap at 8
  }

  useEffect(() => {
    const semester = calculateSemester(currentUser.joined_year);
    console.log(semester);
  }, []);
  
  
 return (
  <div>
    <HeaderBar />
    <div className={styles.backgroundImage} />
    <GreetingSection />
    <FormsSection />
    <FooterBar />
  </div>
);
}
export default Homepage;
