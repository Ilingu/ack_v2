import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" className="scroll-smooth">
        <Head>
          <meta charSet="UTF-8" />
          {/* Config */}
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" sizes="192x192" href="/IconAck192.png" />
          <meta name="apple-mobile-web-app-title" content="ACK" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="msapplication-TileColor" content="#1b1b42" />
          <meta name="msapplication-tap-highlight" content="no" />
          <meta name="theme-color" content="#1b1b42" />
          <meta name="msapplication-navbutton-color" content="#1b1b42" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          {/* App */}
          <meta name="keywords" content="Anime Checker, ACK, My Anime List" />
          <meta name="description" content="Make Your List Of Anime" />
          <meta name="author" content="Ilingu" />
          <meta name="application-name" content="ACK" />
          {/* Google */}
          <meta name="robots" content="index,follow,noodp" />
          <meta name="googlebot" content="index,follow" />
          {/* Social */}
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:url" content="https://ack.vercel.app" />
          <meta name="twitter:title" content="ACK" />
          <meta name="twitter:description" content="Make Your List Of Anime" />
          <meta
            name="twitter:image"
            content="https://ack.vercel.app/IconAck192.png"
          />
          <meta name="twitter:creator" content="@IlinguDev" />
          <meta name="twitter:app:country" content="FR" />
          <meta name="twitter:app:name:iphone" content="ACK" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="ACK" />
          <meta property="og:description" content="Make Your List Of Anime" />
          <meta property="og:site_name" content="ACK" />
          <meta property="og:url" content="https://ack.vercel.app" />
          <meta
            property="og:image"
            content="https://ack.vercel.app/IconAck192.png"
          />
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
