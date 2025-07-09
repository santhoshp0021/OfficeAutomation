import React from "react";
import Error from "../../ui/Error";

export default function FormRow({ label, children, error }) {
  return (
    <div className="flex flex-col">
      <div className="my-2 p-1 font-semibold flex justify-between flex-col">
        <label id={label} className="capitalize text-xl my-1">
          {label}
        </label>
        {children}
      </div>
      {error && <Error>{error.message}</Error>}
    </div>
  );
}
