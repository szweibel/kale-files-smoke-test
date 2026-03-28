import { Hono } from "hono";

type FilesBucket = {
  put(
    key: string,
    value: string,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
    }
  ): Promise<void>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
};

type Bindings = {
  FILES: FilesBucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.html(`<!doctype html>
<html lang="en">
  <body style="font-family: ui-sans-serif, sans-serif; padding: 2rem;">
    <h1>kale-files-smoke-test</h1>
    <p>This app verifies the isolated FILES bucket that Kale Deploy provisions for a project.</p>
    <p><a href="/api/files-smoke">Run the files smoke test</a></p>
  </body>
</html>`));

app.get("/api/health", (c) => c.json({ ok: true, project: "kale-files-smoke-test" }));

app.get("/api/files-smoke", async (c) => {
  const key = "smoke/ping.txt";
  const value = `FILES smoke test at ${new Date().toISOString()}`;
  await c.env.FILES.put(key, value, {
    httpMetadata: {
      contentType: "text/plain; charset=utf-8"
    }
  });
  const object = await c.env.FILES.get(key);
  const readBack = object ? await object.text() : null;

  return c.json({
    ok: true,
    binding: "FILES",
    key,
    wrote: value,
    readBack,
    matches: readBack === value
  });
});

export default app;
