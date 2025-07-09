import React from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import "./FooterBar.css";

// Import team member images
import mem1 from "../assests/members/mem-1.jpg";
import mem2 from "../assests/members/mem-2.jpg";
import mem3 from "../assests/members/mem-3.jpg";
import mem4 from "../assests/members/mem-4.jpg";

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const FooterContainer = styled.footer`
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  color: #fff;
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
  min-height: 200px;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3498db, #e74c3c, #2ecc71, #f1c40f);
    animation: gradientMove 3s linear infinite;
  }

  @keyframes gradientMove {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const FooterSection = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FooterTitle = styled.h3`
  color: #3498db;
  font-size: 1.2rem;
  position: relative;
  display: inline-block;

  &::after {
    content: "";
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 50px;
    height: 2px;
    background: #3498db;
    transition: width 0.3s ease;
  }

  &:hover {
    color: #3498db;
    cursor: pointer;
  }

  &:hover::after {
    width: 100%;
  }
`;

const ContactItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #ecf0f1;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateX(10px);
  }

  svg {
    color: #3498db;
    font-size: 1.2rem;
  }
`;

const ContactText = styled.span`
  font-size: 0.95rem;
  opacity: 0.9;
`;

const TeamMembersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const TeamMember = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const TeamMemberImage = styled.div`
  width: 75px;
  height: 75px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TeamMemberInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TeamMemberName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #ecf0f1;
`;

// const TeamMemberRole = styled.span`
//   font-size: 0.75rem;
//   color: #95a5a6;
// `;

const FooterBottom = styled.div`
  text-align: center;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #95a5a6;
  font-size: 0.9rem;
`;

const FooterBar = () => {
  const contactInfo = [
    {
      icon: <FaEnvelope />,
      text: "hodcse@annauniv.edu",
      label: "Email",
    },
    {
      icon: <FaPhone />,
      text: "044 2235 8801/02",
      label: "Phone",
    },
    {
      icon: <FaMapMarkerAlt />,
      text: "CEG Campus, Guindy, Anna University, Chennai-600025",
      label: "Address",
    },
  ];

  const teamMembers = [
    {
      name: "Mohammed Salih",
      image: mem1,
    },
    {
      name: "Trinesh G",
      image: mem3,
    },
    {
      name: "Nola Thomas Daisy",
      image: mem2,
    },
    {
      name: "Jones Rozario I J",
      image: mem4,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <FooterContainer>
      <FooterContent
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <FooterSection variants={itemVariants}>
          <FooterTitle>Contact Information</FooterTitle>
          {contactInfo.map((item, index) => (
            <ContactItem
              key={index}
              variants={itemVariants}
              whileHover={{ x: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {item.icon}
              <div>
                <div style={{ fontSize: "0.8rem", color: "#95a5a6" }}>
                  {item.label}
                </div>
                <ContactText>{item.text}</ContactText>
              </div>
            </ContactItem>
          ))}
        </FooterSection>

        <FooterSection variants={itemVariants}>
          <FooterTitle>Quick Links</FooterTitle>
          <ContactItem as={motion.a} href="/feedback" variants={itemVariants}>
            Submit Feedback
          </ContactItem>
          <ContactItem as={motion.a} href="/grievance" variants={itemVariants}>
            File Grievance
          </ContactItem>
          <ContactItem as={motion.a} href="/home" variants={itemVariants}>
            Home
          </ContactItem>
        </FooterSection>

        <FooterSection variants={itemVariants}>
          <FooterTitle>Our Team</FooterTitle>
          <TeamMembersGrid>
            {teamMembers.map((member, index) => (
              <TeamMember
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <TeamMemberImage>
                  <img src={member.image} alt={member.name} />
                </TeamMemberImage>
                <TeamMemberInfo>
                  <TeamMemberName>{member.name}</TeamMemberName>
                </TeamMemberInfo>
              </TeamMember>
            ))}
          </TeamMembersGrid>
        </FooterSection>
      </FooterContent>

      <FooterBottom
        as={motion.div}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        © {new Date().getFullYear()} Student Care Portal. All rights reserved.
      </FooterBottom>
    </FooterContainer>
  );
};

export default FooterBar;
