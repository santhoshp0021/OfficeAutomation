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
  TbBookUpload,
  TbLogin2,
} from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { UserData } from "../context/UserContext";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = UserData();
  const isFaculty = user?.role === "faculty";
  const isAdmin = user?.role === "admin";

  const fullLinks = [
    { name: "Home", path: "/", icon: <TbHome />, roles: ["all"] },
    { name: "Scholars", path: "scholars", icon: <TbUser />, roles: ["all"] },
    { name: "Add Scholar", path: "scholar/add", icon: <TbUserPlus />, roles: ["faculty"] },
    { name: "Publications", path: "publications", icon: <TbBook />, roles: ["all"] },
    { name: "Add Publication", path: "publication/add", icon: <TbBookUpload />, roles: ["faculty"] },
    { name: "OD Request", path: "OD/new", icon: <TbFilePlus />, roles: ["faculty"] },
    { name: "OD History", path: "OD", icon: <TbHistory />, roles: ["all"] },
    // { name: "Generate CR", path: "cr", icon: <TbReport />, roles: ["all"] },
    { name: "View CR", path: "CR/view", icon: <TbReport />, roles: ["all"] },
    { name: "Consolidation Report", path: "/admin/consolidation-report/menu", icon: <TbReport />, roles: ["admin"] },
    ...(user
      ? [{ name: "Logout", path: "/", icon: <TbLogout2 />, roles: ["all"] }]
      : [
          { name: "Login", path: "/login", icon: <TbLogin2 />, roles: ["all"] },
          { name: "Signup", path: "/signup", icon: <TbUserPlus />, roles: ["all"] },
        ]),
  ];


  const links = fullLinks.filter((link) => {
    if (link.name === "Generate CR" && isAdmin) return false;
    if (link.roles.includes("all")) return true;
    if (link.roles.includes("faculty") && isFaculty) return true;
    if (link.roles.includes("admin") && isAdmin) return true;
    return false;
  });


  function handleClose() {
    setOpen((open) => !open);
  }
  return (
    <div
      className={`fixed left-0 top-0 h-full z-[1000] ${
        open ? "w-72" : "w-10"
      } transition-all duration-300`}
      style={{ background: open ? '#145DA0' : 'transparent' }}
    >
      <div
        className={`${
          !open ? "hidden" : "block"
        } bg-[#145DA0] flex flex-col text-white w-full h-full`}
      >
        <h1 className="font-bold text-2xl text-shadow-2xl text-shadow-black text-center mt-10 mb-0">
          Department of CSE
        </h1>
        <button
          onClick={handleClose}
          className="absolute right-0 top-[45%] text-3xl hover:text-[#fee199] hover:cursor-pointer mt-5 mr-2 "
        >
          {open && <TbLayoutSidebarLeftCollapseFilled />}
        </button>
        <ul className=" mx-auto justify-center my-auto">
          {links.map((item, index) => (
            <li className="hover:text-[#fee199] my-1 text-xl flex" key={index}>
              <span className="p-2 self-center">{item.icon}</span>
              <NavLink
                to={item.path}
                onClick={() => {
                  if (item.name === "Logout") {
                    logout();
                  }
                  setOpen(false);
                }}
                className="self-center mx-1 relative group text-[#F9F6F0]"
              >
                {item.name}
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#fee199] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      {!open && (
        <button
          onClick={handleClose}
          className="absolute right-0 text-3xl lg:bg-[#145DA0]  text-[#145DA0] lg:text-[#F9F6F0]  hover:text-[#fee199] hover:cursor-pointer text-center w-full h-full"
        >
          <TbLayoutSidebarRightCollapseFilled />
        </button>
      )}
    </div>
  );
}
