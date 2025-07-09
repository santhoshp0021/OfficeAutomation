import React, {
  cloneElement,
  createContext,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { HiXMark } from "react-icons/hi2";

const ModalContext = createContext();
export default function Modal({ children }) {
  const [openName, setOpenName] = useState("");

  const close = () => setOpenName("");
  const open = setOpenName;
  return (
    <ModalContext.Provider value={{ openName, open, close }}>
      {children}
    </ModalContext.Provider>
  );
}

function Body({ children, opens }) {
  const { open } = useContext(ModalContext);
  return cloneElement(children, { onClick: () => open(opens) });
}
function Window({ children, name }) {
  const { openName, close } = useContext(ModalContext);

  //   const ref = UseOutsideClick(close);

  if (name !== openName) return null;
  return createPortal(
    <div className="flex justify-center items-center w-full h-screen backdrop-blur-sm  fixed top-0 left-0 z-10 transition-all duration-300">
      <div className="fixed lg:h-[95%] lg:w-[60%] lg:ml-[10%] shadow-xl backdrop-blur-lg rounded-lg ">

        <button
          onClick={close}
          className="absolute top-10 right-0 text-3xl hover:cursor-pointer h-10 w-10 my-0"
        >
          <HiXMark />
        </button>
        <div>{cloneElement(children, { onClose: close })}</div>
      </div>
    </div>,
    document.body
  );
}

Modal.Body = Body;
Modal.Window = Window;
