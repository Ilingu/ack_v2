import type { NextApiRequest, NextApiResponse } from "next";
import { IsBlacklistedHost } from "../../lib/utils/ApiFunc";

const ApiRoute = async (
  { headers: { host } }: NextApiRequest,
  res: NextApiResponse
) => {
  const AccessDenied = IsBlacklistedHost(host);
  const responseTexte = `ACK API ROUTE${
    AccessDenied ? ": Access DENIED" : ": Access ACCEPTED"
  }`;

  res.status(AccessDenied ? 400 : 200).send(responseTexte);
};
export default ApiRoute;
