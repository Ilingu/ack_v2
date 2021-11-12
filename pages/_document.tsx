import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="fr">
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/Icon.png" />
          <meta charSet="UTF-8" />
          <meta name="theme-color" content="#000000" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="msapplication-navbutton-color" content="#000000" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          <meta name="keywords" content="Anime Checker, ACK, My Anime List" />
          <meta name="description" content="Make Your List Of Anime" />
          <meta name="author" content="Ilingu ©" />
          <meta name="robots" content="index, follow" />
        </Head>
        <body className="bg-gray-800">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
