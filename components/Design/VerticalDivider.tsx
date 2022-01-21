import React, { FC } from "react";

const VerticalDivider: FC<{ Styling?: string }> = ({ Styling }) => (
  <div
    className={`h-full w-2 rounded-sm cursor-default py-3 text-headline overflow-hidden bg-headline  
    ${Styling ? Styling : "translate-y-1"}`}
  ></div>
);

export default VerticalDivider;
