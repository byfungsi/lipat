import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const catalog = JSON.parse(
  readFileSync("examples/react-demo/public/templates/catalog.json", "utf8"),
);
const paths = catalog.map(
  (t) => `examples/react-demo/public/templates/${t.id}/deck.pptx`,
);
const samples = ["column", "bar", "line", "area", "pie", "doughnut"].map(
  (kind) => `artifacts/charts-svg/${kind}.pptx`,
);
execFileSync(
  process.env.LIPAT_DOTNET ?? "dotnet",
  [
    "run",
    "--project",
    "tools/pptx-validator/PptxValidator.csproj",
    "--",
    ...paths,
    ...samples,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DOTNET_CLI_TELEMETRY_OPTOUT: "1",
      DOTNET_SKIP_FIRST_TIME_EXPERIENCE: "1",
    },
  },
);
execFileSync(
  process.env.LIPAT_PYTHON ?? "python3",
  ["scripts/verify-template-interop.py"],
  { stdio: "inherit" },
);
