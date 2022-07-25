import React, { FC } from "react";
import { FaCheck, FaSearch, FaSync } from "react-icons/fa";

interface HandleInputProps {
  HandleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  Value: string | number;
  setValue: React.Dispatch<React.SetStateAction<string | number>>;
  placeholder?: string;
  className?: string;
}

const HandleInput: FC<HandleInputProps> = ({
  HandleSubmit,
  Value,
  setValue,
  placeholder,
  className,
}) => {
  return (
    <form className={`${className}`} onSubmit={HandleSubmit}>
      <input
        type="text"
        value={Value}
        onChange={(e) => setValue(e.target.value)}
        className="text-headline focus:ring-primary-main h-full w-[90%] rounded-l-md bg-black text-center font-semibold outline-none transition-all focus:ring-2 sm:text-lg"
        placeholder={placeholder}
        data-testid={
          className.includes("search") ? "HomeSearchInput" : "HomeAddGroupInput"
        }
      />
      <button
        type="submit"
        className="text-headline focus:ring-primary-main h-full -translate-y-px rounded-r-md bg-black px-2 font-semibold outline-none transition-all focus:ring-2"
        data-testid={
          className.includes("search")
            ? "HomeSearchSubmitionBtn"
            : "HomeAddGroupSubmitionBtn"
        }
        title={
          className.includes("search")
            ? "Search"
            : className.includes("reset")
            ? "Reset"
            : `Create Group "${Value}"`
        }
      >
        {className.includes("search") ? (
          <FaSearch className="icon" />
        ) : className.includes("reset") ? (
          <FaSync className="icon" />
        ) : (
          <FaCheck className="icon" />
        )}
      </button>
    </form>
  );
};

export default HandleInput;
