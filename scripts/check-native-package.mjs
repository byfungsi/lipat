import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(
  new URL("../packages/lipat-native/", import.meta.url),
);
const requireFile = (path) => {
  try {
    return readFileSync(resolve(root, path));
  } catch {
    throw Error(
      `Native package is missing ${path}; build both iOS and Android engines before packing`,
    );
  }
};
for (const path of [
  "dist/index.js",
  "dist/index.d.ts",
  "native/Lipat.podspec",
  "native/ios/LipatModule.swift",
  "native/android/src/main/java/expo/modules/lipat/LipatModule.kt",
  "expo-module.config.json",
])
  requireFile(path);
for (const slice of ["ios-arm64", "ios-arm64_x86_64-simulator"]) {
  const data = requireFile(
    `native/LipatRustCore.xcframework/${slice}/liblipat_mobile.a`,
  );
  if (
    !data.includes(Buffer.from("lipat_native_execute")) ||
    !data.includes(Buffer.from("lipat_native_free"))
  )
    throw Error(`Native iOS ${slice} is missing the Lipat C ABI`);
  requireFile(
    `native/LipatRustCore.xcframework/${slice}/Headers/module.modulemap`,
  );
}
for (const abi of ["arm64-v8a", "armeabi-v7a", "x86_64", "x86"]) {
  const data = requireFile(
    `native/android/src/main/jniLibs/${abi}/liblipat_mobile.so`,
  );
  if (data.subarray(0, 4).toString("hex") !== "7f454c46")
    throw Error(`Invalid Android ELF: ${abi}`);
  for (const method of ["getAbiVersionNative", "executeNative"])
    if (
      !data.includes(
        Buffer.from(`Java_expo_modules_lipat_LipatModule_${method}`),
      )
    )
      throw Error(`Android ${abi} is missing ${method}`);
}
console.log(
  "Native package includes real iOS device/simulator and all four Android JNI binaries.",
);
