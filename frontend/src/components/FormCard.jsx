import React from "react";
import "./FormCard.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const FormCard = ({
  title,
  description,
  buttonLabel,
  icon,
  buttonClass,
  formEffect,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (buttonLabel === "Feed Back") {
      navigate("/feedback");
    } else if (buttonLabel === "Grievance") {
      navigate("/grievance");
    }
  };

  return (
    <motion.div
      className="form-card"
      whileInView={formEffect.animate}
      whileHover={{
        scale: 1.05,
        cursor: "pointer",
        boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "rgba(44, 62, 80, 0.85",
        borderRadius: "10px",
        transition: {
          duration: 0.5,
          type: "spring",
          stiffness: 100,
        },
      }}
      viewport={{ once: true }}
      initial={formEffect.initial}
      exit={formEffect.exit}
    >
      <h3>{title}</h3>
      <p>{description}</p>
      <button className={buttonClass} onClick={handleClick}>
        <i className={icon}></i> {buttonLabel}
      </button>
    </motion.div>
  );
};

export default FormCard;
