import React from 'react';
import "./statcard.css";

const StatCard = ({ title, value, icon: Icon, color, highlight }) => (
  <div className={`statcard statcard--${color}${highlight ? ' statcard--highlight' : ''}`}>
    <div className="statcard__icon">{Icon && <Icon />}</div>
    <div>
      <div className="statcard__title">{title}</div>
      <div className="statcard__value">{value}</div>
    </div>
  </div>
);

export default StatCard;
