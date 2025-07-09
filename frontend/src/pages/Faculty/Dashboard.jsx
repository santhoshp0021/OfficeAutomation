import React from "react";
import Sidebar from "../../ui/Sidbear";
import { UserData } from "../../context/UserContext";

export default function Dashboard() {
  const { user } = UserData();
  console.log(user)
  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-3xl font-bold capitalize text-center mb-6">
        Welcome {user.name}
      </h1>

      <div className="bg-[  ] text-black rounded-2xl shadow-md p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Your Profile</h2>
        <div className="space-y-3 text-lg">
          <p>
            <span className="font-bold">Name:</span> {user.name}
          </p>
          <p>
            <span className="font-bold">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-bold">Role:</span> {user.role}
          </p>
        </div>
      </div>
    </div>
  );
}
