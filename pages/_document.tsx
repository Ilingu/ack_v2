import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="fr" className="scroll-smooth">
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/Icon.png" />
          <meta charSet="UTF-8" />
          <meta name="theme-color" content="#6366f1" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="msapplication-navbutton-color" content="#6366f1" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          <meta name="keywords" content="Anime Checker, ACK, My Anime List" />
          <meta name="description" content="Make Your List Of Anime" />
          <meta name="author" content="Ilingu" />
          <meta name="robots" content="index, follow" />
        </Head>
        <body className="bg-bgi-main">
          <noscript
            style={{
              fontSize: "40px",
              fontFamily: "sans-serif",
              textAlign: "center",
            }}
          >
            {"> "}To use ACK,{" "}
            <a
              href="https://www.enable-javascript.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6366f1" }}
            >
              please enable JavaScript.
              <br />
            </a>
          </noscript>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
