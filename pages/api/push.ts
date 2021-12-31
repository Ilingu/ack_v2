import { NextApiRequest, NextApiResponse } from "next";

// Push notif from anime

export default async function PushNotif(
  { query: { token } }: NextApiRequest,
  res: NextApiResponse
) {
  // res.status(404).json({ message: `404` });
  // res.status(200).json();
}
