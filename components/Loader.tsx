import { FC } from "react";

interface Props {
  show: boolean;
}

const Loader: FC<Props> = ({ show }) => {
  return show ? <div></div> : null;
};

export default Loader;
