import type { NextApiRequest, NextApiResponse } from "next";
import { IsBlacklistedHost } from "../../lib/server/ApiFunc";

const ApiRoute = async (
  { headers: { host } }: NextApiRequest,
  res: NextApiResponse
) => {
  const AccessDenied = IsBlacklistedHost(host);
  const responseTexte = AccessDenied
    ? `Access <span style="color: #f00;">DENIED</span>`
    : `Access <span style="color: green;">ACCEPTED</span>`;

  res.setHeader("Content-Type", "text/html");
  res.status(AccessDenied ? 400 : 200).send(
    `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="icon" href="/IconAck192.png" alt="Our logo" />
          <title>ACK API 😎</title>
          <style>
            * {
              font-family: Courier, monospace;
              color: rgb(179, 180, 255);
            }
            body {
              background-color: rgb(44, 45, 48);
            }
          </style>
        </head>
        <body>
          <div style="text-align: center">
            <h1><img src="/IconAck192.png" width="32" /> ACK API ROUTE 💥</h1>
            <h2>${responseTexte}</h2>
            <h3>✅ All services are up (because otherwise you wouldn't have been able to see this message)</h3>
            <p>PS: no, we aren't hiring (ಥ _ ಥ)</p>
          </div>
        </body>
      </html>`
  );
};
export default ApiRoute;
