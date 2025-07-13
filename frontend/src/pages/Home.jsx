import { useState } from "react";
import Sidebar from "../ui/Sidebar";
import { Outlet } from "react-router-dom";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex">
      <div className="fixed top-0 left-0 h-screen z-10">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-72" : "ml-0"
        } flex-1 h-screen overflow-y-auto bg-[#fbfbfb]`}
      >
        <Outlet />
      </main>
    </div>
  );
}
