import { PropsChildren } from "../lib/types/types";

interface Props {
  children: PropsChildren;
}

const AuthCheck = ({ children }: Props) => {
  return children;
};

export default AuthCheck;
