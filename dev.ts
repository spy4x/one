#!/usr/bin/env -S deno run -A --watch=static/,routes/
import { Builder } from "fresh/dev";

const builder = new Builder();
await builder.listen(() => import("./main.ts"));
