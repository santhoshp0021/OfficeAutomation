import React from "react";
import FormCard from "./FormCard";
import "./FormsSection.css";
import { color, motion } from "framer-motion";

const FormsSection = () => {
  const forms = [
    {
      title: "Want to Give Feedback to your teachers?",
      description:
        "Help us improve your learning experience by sharing honest feedback. It only takes 2 minutes to complete. All responses are anonymous and valued. Click below and let us know how we're doing!",
      buttonLabel: "Feed Back",
      buttonClass: "feedback-btn",
    },
    {
      title: "Facing an issue you want to report?",
      description:
        "Help us to create a better campus by sharing your grievance. It takes just a few moments to submit. Your identity stays confidential and secure. Click below to raise your concern — we're here to listen!",
      buttonLabel: "Grievance",
      buttonClass: "grievance-btn",
    },
  ];

  const formmEffect = {
    initial: { opacity: 0, y: 40 },

    exit: {
      opacity: 0,
      y: -40,
      transition: { duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 },
    },
  };
  return (
    <section id="your-voice-matter" className="forms-section">
      <div className="forms-bg" />
      <div className="forms-content">
        <div className="forms-title">
          {"Your Voice Matters".split("").map((char, index) => {
            return (
              <motion.span
                key={index}
                initial={{ opacity: 0, x: 20 }}
                viewport={{ once: true }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: 0.5,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                  },
                }}
                className="form-title"
                style={{
                  textAlign: "center",
                  fontSize: index == 0 ? 70 : 58,
                  color: [0, 5, 11].includes(index) ? "#f1c40f" : "white",
                }}
                exit={{ opacity: 0, x: -20 }}
              >
                {char || " "}
              </motion.span>
            );
          })}
        </div>
        <div className="forms-row">
          {forms.map((form, index) => (
            <FormCard
              key={index}
              title={form.title}
              description={form.description}
              buttonLabel={form.buttonLabel}
              buttonClass={form.buttonClass}
              formEffect={{
                ...formmEffect,
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 1.2 + index * 0.4,
                    type: "spring",
                    stiffness: 100,
                  },
                },
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FormsSection;
