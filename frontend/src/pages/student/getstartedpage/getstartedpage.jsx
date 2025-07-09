import "./getstartedpage.css";
import Lottie from "lottie-react";
import phoneHand from "../../../assests/animations/getting-started-logo-animation.json";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GetStartedPage = () => {
  
  const navigate = useNavigate();

  const hoverEffect = {
    initial: { scale: 1 },
    whileHover: { scale: 1.05 },
  };

  return (
    <div className="getstarted-container">
      <div className="getstarted-left">
        <div className="getstarted-shape"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="getstarted-circle"
        >
          {/* Replace with your SVG or image as needed */}
          <Lottie animationData={phoneHand} loop={true} />
        </motion.div>
      </div>
      <div className="getstarted-right">
        <h1 className="getstarted-title">Student Care</h1>
        <p className="getstarted-subtitle">
          Streamline Feedback and grievances
          <br />
          effectively
        </p>
        <motion.button {...hoverEffect} onClick={() => navigate("/login")} className="getstarted-btn">
          Get Started
        </motion.button>
      </div>
    </div>
  );
};

export default GetStartedPage;
