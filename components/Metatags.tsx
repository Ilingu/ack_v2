import Head from "next/head";
import React, { FC } from "react";

interface Props {
  title?: string;
  description: string;
  image?: string;
}

const MetaTags: FC<Props> = ({
  title = "ACK:Anim-Checker",
  description = "Make your list of Anime",
  image = null,
}) => {
  return (
    <Head>
      <title>{title}</title>
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width"
      />
      <meta name="description" content={description} />
      <meta name="author" content="Ilingu" />
      {image ? (
        <link rel="icon" href={image} />
      ) : (
        <link rel="icon" href="/favicon.ico" />
      )}
    </Head>
  );
};
export default MetaTags;
