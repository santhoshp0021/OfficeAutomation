import React, { useState } from "react";
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarRightCollapseFilled,
  TbHome,
  TbUser,
  TbBook,
  TbFilePlus,
  TbHistory,
  TbUserPlus,
  TbReport,
  TbLogout2,
} from "react-icons/tb";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const links = [
    { name: "Home", path: "/", icon: <TbHome /> },
    { name: "Scholars", path: "scholars", icon: <TbUser /> },
    { name: "Publications", path: "publications", icon: <TbBook /> },
    { name: "OD Request", path: "OD/new", icon: <TbFilePlus /> },
    { name: "OD History", path: "OD", icon: <TbHistory /> },
    { name: "Add Scholar", path: "scholar/add", icon: <TbUserPlus /> },
    { name: "Generate CR", path: "cr", icon: <TbReport /> },
    { name: "Logout", path: "/", icon: <TbLogout2 /> },
  ];
  function handleClose() {
    setOpen((open) => !open);
  }
  return (
    <div
      className={`relative left-0 top-0 h-screen ${
        open ? "lg:w-96" : "lg:w-10"
      } transition-all duration-300`}
    >
      <div
        className={`${
          !open ? "hidden" : "block"
        } bg-[#845763] flex flex-col text-[#F9F6F0] w-full h-full`}
      >
        <h1 className="font-bold text-xl text-center mt-10 mb-0">
          Department of CSE
        </h1>
        <button
          onClick={handleClose}
          className="absolute right-0 top-[45%] text-3xl hover:text-[#fee199] hover:cursor-pointer mt-5 mr-2"
        >
          {open && <TbLayoutSidebarLeftCollapseFilled />}
        </button>
        <ul className="self-center mx-auto justify-center my-auto">
          {links.map((item, index) => (
            <li className="hover:text-[#fee199] my-1 text-lg flex" key={index}>
              <span className="p-2 self-center">{item.icon}</span>
              <NavLink to={item.path} className="self-center mx-1">
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      {!open && (
        <button
          onClick={handleClose}
          className="absolute right-0 text-3xl bg-[#6F5B3E] text-[#F9F6F0]  hover:text-[#fee199] hover:cursor-pointer text-center w-full h-full"
        >
          <TbLayoutSidebarRightCollapseFilled />
        </button>
      )}
    </div>
  );
}
