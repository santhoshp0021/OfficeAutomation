
import Sidebar from "../ui/Sidbear";
import { Outlet } from "react-router-dom";
export default function Home() {
  return (
    <div className="flex">
      <div className="fixed top-0 left-0 h-screen z-10">
        <Sidebar />
      </div>
      <main className="lg:ml-[240px] flex-1 h-screen overflow-y-auto bg-[#edf4fb] bg-[#fbfbfb]">
        <Outlet />
      </main>
    </div>
  );
}

