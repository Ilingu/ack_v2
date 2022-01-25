import React, { FC } from "react";
import { FaCheck } from "react-icons/fa";

interface HandleInputProps {
  HandleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  Value: string | number;
  setValue: React.Dispatch<React.SetStateAction<string | number>>;
}

const HandleInput: FC<HandleInputProps> = ({
  HandleSubmit,
  Value,
  setValue,
}) => {
  return (
    <form
      className="xl:absolute xl:-top-5 xl:left-2 mt-2"
      onSubmit={HandleSubmit}
    >
      <input
        type="text"
        value={Value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-black sm:text-lg rounded-l-md py-2 sm:w-96 w-80 text-center font-semibold text-headline outline-none focus:ring-2 focus:ring-primary-main transition-all"
        placeholder="Name of group (Already existing or not)"
      />
      <button
        type="submit"
        className="bg-black h-11 py-2 px-2 rounded-r-md -translate-y-px font-semibold text-headline outline-none focus:ring-2 focus:ring-primary-main transition-all"
      >
        <FaCheck className="icon" />
      </button>
    </form>
  );
};

export default HandleInput;
