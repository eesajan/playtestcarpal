import http from "node:http";

const configuredBaseUrl = process.env.BASE_APP_URL || "http://127.0.0.1:3000";
const parsedBaseUrl = new URL(configuredBaseUrl);
const port = Number(process.env.PORT || parsedBaseUrl.port || 3000);
const host = process.env.HOST || "127.0.0.1";

const page = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fresh Sample App</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, Helvetica, sans-serif;
        background: #f6f7fb;
        color: #172033;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
      }

      main {
        width: min(420px, calc(100vw - 32px));
        padding: 28px;
        border: 1px solid #d7dce8;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 48px rgba(28, 39, 66, 0.12);
      }

      h1 {
        margin: 0 0 16px;
        font-size: 28px;
        line-height: 1.2;
      }

      p {
        margin: 0 0 18px;
        line-height: 1.5;
      }

      label {
        display: grid;
        gap: 6px;
        margin: 14px 0;
        font-weight: 700;
      }

      input {
        min-height: 42px;
        border: 1px solid #aab3c5;
        border-radius: 6px;
        padding: 0 12px;
        font: inherit;
      }

      button {
        min-height: 42px;
        border: 0;
        border-radius: 6px;
        padding: 0 18px;
        background: #2557a7;
        color: #ffffff;
        cursor: pointer;
        font: 700 15px Arial, Helvetica, sans-serif;
      }

      button:focus-visible,
      input:focus-visible {
        outline: 3px solid #8ab4ff;
        outline-offset: 2px;
      }
    </style>
  </head>
  <body>
    <main id="app"></main>
    <script>
      const app = document.querySelector("#app");

      const screens = {
        welcome: '<h1>Improve Your Morning, Love your life</h1><p>Start a guided routine.</p><button data-next="routines">Next</button>',
        routines: '<h1>6 quick routines to win everyday</h1><p>Choose a routine path.</p><button data-next="entry">Next</button>',
        entry: '<h1>Ready to continue?</h1><p>Use your account to keep your progress.</p><button data-next="login">Login</button>',
        login: '<h1>Login</h1><label>Email<input data-testid="email" aria-label="Email" placeholder="Email" /></label><label>Password<input data-testid="password" aria-label="Password" placeholder="Password" type="password" /></label><button aria-label="Login" data-next="reminder">Sign in</button>',
        reminder: '<h1>Reminder</h1><p>Keep your daily routine on track.</p><button data-next="modal">Next</button>',
        modal: '<h1>Modal</h1><p>Confirm the reminder.</p><button data-next="home">OK</button>',
        home: '<h1>Home</h1><p>Tip: Quickly access tracks and activities</p>'
      };

      function render(name) {
        app.innerHTML = screens[name] || screens.welcome;
      }

      document.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-next]");
        if (button) render(button.dataset.next);
      });

      render("welcome");
    </script>
  </body>
</html>`;

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("ok");
    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(page);
});

server.listen(port, host, () => {
  console.log(`Sample app listening at http://${host}:${port}`);
});
