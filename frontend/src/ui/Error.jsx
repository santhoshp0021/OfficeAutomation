import React from "react";

export default function Error({ children }) {
  return (
    <p className="flex  self-center justify-center text-red-500 text-lg font-semibold mx-auto w-full">{children}</p>
  );
}
