import React, { FC } from "react";
import { FaCheck } from "react-icons/fa";

interface HandleInputProps {
  HandleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  Value: string | number;
  setValue: React.Dispatch<React.SetStateAction<string | number>>;
  placeholder?: string;
}

const HandleInput: FC<HandleInputProps> = ({
  HandleSubmit,
  Value,
  setValue,
  placeholder,
}) => {
  return (
    <form
      className="mt-2 xl:absolute xl:-top-5 xl:left-2"
      onSubmit={HandleSubmit}
    >
      <input
        type="text"
        value={Value}
        onChange={(e) => setValue(e.target.value)}
        className="text-headline focus:ring-primary-main w-80 rounded-l-md bg-black py-2 text-center font-semibold outline-none transition-all focus:ring-2 sm:w-96 sm:text-lg"
        placeholder={placeholder}
      />
      <button
        type="submit"
        className="text-headline focus:ring-primary-main h-11 -translate-y-px rounded-r-md bg-black py-2 px-2 font-semibold outline-none transition-all focus:ring-2"
      >
        <FaCheck className="icon" />
      </button>
    </form>
  );
};

export default HandleInput;
