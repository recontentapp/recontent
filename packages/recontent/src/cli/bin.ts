#!/usr/bin/env node
import module from "node:module";

// Static imports are evaluated before a module body runs, so the heavy CLI is
// imported dynamically, after the compile cache is on.
module.enableCompileCache?.();
await import("./main.js");
