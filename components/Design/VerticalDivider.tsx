import React, { FC } from "react";

const VerticalDivider: FC<{ Styling?: string }> = ({ Styling }) => (
  <div
    className={`text-headline bg-headline h-full w-2 cursor-default overflow-hidden rounded-sm py-3  
    ${Styling ? Styling : "translate-y-1"}`}
  ></div>
);

export default VerticalDivider;
