import type { ComponentType } from "preact";

interface AppProps {
  Component: ComponentType;
}

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>The Only One</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="description" content="Одна задача — весь фокус" />
        <script src="/sw.js" type="text/javascript" defer></script>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: 100%; background: #0a0a0a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
          body { display: flex; justify-content: center; min-height: 100dvh; }
          a { color: inherit; text-decoration: none; }
          button { cursor: pointer; border: none; background: none; color: inherit; font: inherit; }
          textarea, input { font: inherit; color: inherit; }
          ::selection { background: #333; }
        `}</style>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
