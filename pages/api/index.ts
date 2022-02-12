import type { NextApiRequest, NextApiResponse } from "next";

const ApiRoute = async (req: NextApiRequest, res: NextApiResponse) => {
  const AccessDenied = req.headers.host !== "ack.vercel.app";
  const responseTexte = `ACK API ROUTE${
    AccessDenied ? ": Access DENIED" : ": Access ACCEPTED"
  }`;

  res.status(AccessDenied ? 400 : 200).send(responseTexte);
};
export default ApiRoute;
