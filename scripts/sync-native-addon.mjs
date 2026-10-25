import { cpSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
mkdirSync(resolve(root, "packages/lipat-native/native"), { recursive: true });
rmSync(resolve(root, "packages/lipat-native/native/include"), {
  recursive: true,
  force: true,
});
for (const path of ["ios", "android", "include", "Lipat.podspec"])
  cpSync(
    resolve(root, "packages/native", path),
    resolve(root, "packages/lipat-native/native", path),
    { recursive: true },
  );
copyFileSync(
  resolve(root, "LICENSE"),
  resolve(root, "packages/lipat-native/LICENSE"),
);
