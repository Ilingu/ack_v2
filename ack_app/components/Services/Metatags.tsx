import Head from "next/head";
import { FC } from "react";

interface Props {
  title?: string;
  description?: string;
  image?: string;
}

const MetaTags: FC<Props> = ({
  title = "Anim-Checker",
  description = "Make your list of Anime",
  image = "/favicon.ico",
}) => (
  <Head>
    <title>{`ACK: ${title}`}</title>
    <meta
      name="viewport"
      content="minimum-scale=1, initial-scale=1, width=device-width"
    />
    <meta name="description" content={description} />
    <link rel="icon" href={image} />
  </Head>
);

export default MetaTags;
