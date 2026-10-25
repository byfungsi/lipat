import "./sync-native-addon.mjs";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
const ndk =
  process.env.LIPAT_ANDROID_NDK ??
  process.env.ANDROID_NDK_HOME ??
  process.env.ANDROID_NDK_LATEST_HOME;
if (!ndk)
  throw Error(
    "Lipat Android build requires LIPAT_ANDROID_NDK pointing to an installed Android NDK",
  );
const host =
  process.platform === "darwin"
    ? "darwin-x86_64"
    : process.platform === "linux"
      ? "linux-x86_64"
      : "windows-x86_64";
const bin = resolve(ndk, "toolchains/llvm/prebuilt", host, "bin");
const targets = [
  ["aarch64-linux-android", "arm64-v8a", "aarch64-linux-android24"],
  ["armv7-linux-androideabi", "armeabi-v7a", "armv7a-linux-androideabi24"],
  ["x86_64-linux-android", "x86_64", "x86_64-linux-android24"],
  ["i686-linux-android", "x86", "i686-linux-android24"],
];
for (const [target, abi, prefix] of targets) {
  const linker = join(
    bin,
    `${prefix}-clang${process.platform === "win32" ? ".cmd" : ""}`,
  );
  if (!existsSync(linker))
    throw Error("Lipat Android NDK compiler is missing: " + linker);
  const key = `CARGO_TARGET_${target.toUpperCase().replaceAll("-", "_")}_LINKER`;
  execFileSync(
    "cargo",
    ["build", "--release", "-p", "lipat-mobile", "--target", target],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        [key]: linker,
        RUSTFLAGS: [
          process.env.RUSTFLAGS ?? "",
          "-C link-arg=-Wl,-z,max-page-size=16384",
        ]
          .join(" ")
          .trim(),
      },
    },
  );
  const output = resolve(
    "packages/lipat-native/native/android/src/main/jniLibs",
    abi,
  );
  mkdirSync(output, { recursive: true });
  copyFileSync(
    `target/${target}/release/liblipat_mobile.so`,
    join(output, "liblipat_mobile.so"),
  );
}
console.log(
  "Built Android JNI engine for arm64-v8a, armeabi-v7a, x86_64 and x86 (16 KiB-compatible ELF alignment).",
);
