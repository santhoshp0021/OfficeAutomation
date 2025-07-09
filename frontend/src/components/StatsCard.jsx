import React from "react";
import "./StatsCard.css";
import { motion } from "framer-motion";

const StatsCard = ({ icon, label, value, hoverEffect }) => (
  <motion.div className="stats-card" {...hoverEffect}>
    <span>{icon}</span>
    <div>
      <div className="stats-label">{label}</div>
      <div className="stats-value">{value}</div>
    </div>
  </motion.div>
);

export default StatsCard;
