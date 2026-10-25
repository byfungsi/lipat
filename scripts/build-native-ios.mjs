import "./sync-native-addon.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, cpSync } from "node:fs";
import { resolve } from "node:path";
if (process.platform !== "darwin")
  throw Error(
    "Lipat iOS build requires macOS with Xcode and Rust iOS targets installed",
  );
const targets = [
  "aarch64-apple-ios",
  "aarch64-apple-ios-sim",
  "x86_64-apple-ios",
];
for (const target of targets)
  execFileSync(
    "cargo",
    ["build", "--release", "-p", "lipat-mobile", "--target", target],
    { stdio: "inherit" },
  );
const output = resolve("artifacts/native");
mkdirSync(output, { recursive: true });
const simulator = resolve(output, "simulator");
mkdirSync(simulator, { recursive: true });
execFileSync(
  "xcrun",
  [
    "lipo",
    "-create",
    "target/aarch64-apple-ios-sim/release/liblipat_mobile.a",
    "target/x86_64-apple-ios/release/liblipat_mobile.a",
    "-output",
    resolve(simulator, "liblipat_mobile.a"),
  ],
  { stdio: "inherit" },
);
const framework = resolve(output, "LipatRustCore.xcframework");
rmSync(framework, { recursive: true, force: true });
execFileSync(
  "xcodebuild",
  [
    "-create-xcframework",
    "-library",
    resolve("target/aarch64-apple-ios/release/liblipat_mobile.a"),
    "-headers",
    resolve("packages/native/include"),
    "-library",
    resolve(simulator, "liblipat_mobile.a"),
    "-headers",
    resolve("packages/native/include"),
    "-output",
    framework,
  ],
  { stdio: "inherit" },
);
mkdirSync("packages/lipat-native/native", { recursive: true });
rmSync("packages/lipat-native/native/LipatNative.xcframework", {
  recursive: true,
  force: true,
});
cpSync(framework, "packages/lipat-native/native/LipatRustCore.xcframework", {
  recursive: true,
});
console.log("Built iOS device and arm64/x86_64 simulator XCFramework.");
