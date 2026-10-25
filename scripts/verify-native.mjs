import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
execFileSync("cargo", ["build", "-p", "lipat-mobile"], { stdio: "inherit" });
const filename =
  process.platform === "darwin"
    ? "liblipat_mobile.dylib"
    : process.platform === "win32"
      ? "lipat_mobile.dll"
      : "liblipat_mobile.so";
execFileSync(
  process.env.LIPAT_PYTHON ?? "python3",
  ["scripts/verify-native.py", resolve("target/debug", filename)],
  { stdio: "inherit" },
);
