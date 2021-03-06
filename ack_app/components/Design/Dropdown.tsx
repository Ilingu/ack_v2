import { FC, useState } from "react";

interface Props {
  ActiveElem: string;
  className?: string;
}

const Dropdown: FC<Props> = ({ children, ActiveElem, className }) => {
  const [Show, setShow] = useState(false);

  return (
    <div
      data-testid="DropdownBtn"
      className={`relative inline-block h-10 text-center ${className}`}
      onClick={() => setShow((prev) => !prev)}
    >
      <div>
        <button
          type="button"
          className="text-headline bg-primary-darker hover:bg-primary-main inline-flex w-full justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-100"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          Sort By{" "}
          <span className="text-headline ml-1 border-b border-dashed font-bold capitalize tracking-wide">
            {ActiveElem.replaceAll("_", " ")}
          </span>
          <svg
            className={`${
              Show ? "rotate-180" : ""
            } -mr-1 ml-2 h-5 w-5 transition-all`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {Show && (
        <div
          className="bg-primary-main animate-fadeIn text-description absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md text-center font-semibold capitalize shadow-lg ring-1 ring-white ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
          data-testid="DropdownChildOptions"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
