import type { NextApiRequest, NextApiResponse } from "next";

const ApiRoute = async (_: NextApiRequest, res: NextApiResponse) =>
  res.status(200).send("ACK API ROUTE");
export default ApiRoute;
