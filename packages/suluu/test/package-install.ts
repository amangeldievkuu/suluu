import { spawn } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(packageRoot, "../..");

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with code ${String(code)}`));
    });
  });
}

async function installedVersion(packageName: string): Promise<string> {
  const packageJson = JSON.parse(
    await readFile(
      resolve(workspaceRoot, "node_modules", packageName, "package.json"),
      "utf8",
    ),
  ) as { version?: unknown };

  if (typeof packageJson.version !== "string") {
    throw new Error(`Could not resolve installed ${packageName} version.`);
  }

  return packageJson.version;
}

const fixtureRoot = await mkdtemp(join(tmpdir(), "suluu-package-"));

try {
  await run("pnpm", ["build"], packageRoot);
  await run("pnpm", ["pack", "--pack-destination", fixtureRoot], packageRoot);

  const tarballs = (await readdir(fixtureRoot)).filter((file) =>
    file.endsWith(".tgz"),
  );
  const tarball = tarballs[0];
  if (!tarball) throw new Error("pnpm pack did not create a tarball.");

  const requiredExports = [
    ".",
    "./counter-numbers",
    "./duration-pill",
    "./email-morph",
    "./fluid-tabs",
    "./magnet-pull",
    "./morph-button",
    "./notify-morph",
    "./otp-input",
    "./rope-time-picker",
    "./search-morph",
    "./segmented-control",
    "./slide-control",
    "./spotlight-card",
    "./switch-toggle",
    "./theme-toggle",
    "./toast",
    "./styles.css",
  ];
  const [reactVersion, reactDomVersion, currentMotion, typescriptVersion] =
    await Promise.all([
      installedVersion("react"),
      installedVersion("react-dom"),
      installedVersion("motion"),
      installedVersion("typescript"),
    ]);
  const motionVersions = [...new Set(["12.23.26", currentMotion])];

  for (const motionVersion of motionVersions) {
    const motionMajor = motionVersion.startsWith("12.") ? "12" : "13";
    const consumerRoot = join(fixtureRoot, `consumer-motion-${motionMajor}`);
    await mkdir(join(consumerRoot, "src"), { recursive: true });
    await writeFile(
      join(consumerRoot, "package.json"),
      JSON.stringify(
        {
          name: `suluu-package-consumer-motion-${motionMajor}`,
          private: true,
          type: "module",
          packageManager: "pnpm@10.33.0",
          dependencies: {
            motion: motionVersion,
            react: reactVersion,
            "react-dom": reactDomVersion,
            suluu: `file:${join(fixtureRoot, tarball)}`,
          },
          devDependencies: {
            "@types/react": "^19.0.0",
            "@types/react-dom": "^19.0.0",
            typescript: typescriptVersion,
          },
        },
        null,
        2,
      ),
    );
    await writeFile(
      join(consumerRoot, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            jsx: "react-jsx",
            lib: ["DOM", "ES2022"],
            module: "ESNext",
            moduleResolution: "Bundler",
            noEmit: true,
          },
          include: ["src"],
        },
        null,
        2,
      ),
    );
    await writeFile(
      join(consumerRoot, "src/index.tsx"),
      `import { CounterNumbers, DurationPill, EmailMorph, FluidTabs, MagnetPull, MorphButton, NotifyMorph, OtpInput, RopeTimePicker, SearchMorph, SegmentedControl, SlideControl, SpotlightCard, SwitchToggle, ThemeToggle, Toaster, toast } from "suluu";\nimport type { CounterNumbersProps } from "suluu/counter-numbers";\nimport type { DurationPillProps, DurationPillUnitLabels } from "suluu/duration-pill";\nimport type { EmailMorphProps } from "suluu/email-morph";\nimport type { FluidTabsProps } from "suluu/fluid-tabs";\nimport type { MagnetPullProps } from "suluu/magnet-pull";\nimport type { MorphButtonProps } from "suluu/morph-button";\nimport type { NotifyMorphProps } from "suluu/notify-morph";\nimport type { OtpInputProps } from "suluu/otp-input";\nimport type { RopeTimePickerProps } from "suluu/rope-time-picker";\nimport type { SearchMorphProps } from "suluu/search-morph";\nimport type { SegmentedControlProps } from "suluu/segmented-control";\nimport type { SlideControlProps } from "suluu/slide-control";\nimport type { SpotlightCardProps } from "suluu/spotlight-card";\nimport type { SwitchToggleProps } from "suluu/switch-toggle";\nimport type { ThemeToggleProps } from "suluu/theme-toggle";\nimport type { ToasterProps } from "suluu/toast";\nimport "suluu/styles.css";\n\nconst counterProps: CounterNumbersProps = { value: 1284 };\nconst durationUnitLabels: Partial<DurationPillUnitLabels> = { hours: "Hrs." };\nconst durationProps: DurationPillProps = { defaultValue: { hours: 2, minutes: 30, seconds: 0 }, unitLabels: durationUnitLabels };\nconst emailProps: EmailMorphProps = { placeholder: "you@example.com" };\nconst fluidTabsProps: FluidTabsProps = { "aria-label": "Workspace", tabs: [{ value: "inbox", label: "Inbox", icon: <span /> }] };\nconst magnetProps: MagnetPullProps = { children: "Get started" };\nconst morphProps: MorphButtonProps = { "aria-label": "Create new", compactContent: <span>+</span>, expandedContent: <span>Create new</span> };\nconst notifyProps: NotifyMorphProps = { label: "Updates" };\nconst otpProps: OtpInputProps = { length: 6, name: "code" };\nconst ropeTimeProps: RopeTimePickerProps = { defaultValue: { hours: 9, minutes: 30, seconds: 0, period: "AM" } };\nconst searchProps: SearchMorphProps = { "aria-label": "Find" };\nconst segmentProps: SegmentedControlProps = { "aria-label": "Range", options: [{ value: "day", label: "Day" }] };\nconst slideProps: SlideControlProps = { "aria-label": "Volume" };\nconst spotlightProps: SpotlightCardProps = { children: <span>Quiet light</span> };\nconst switchProps: SwitchToggleProps = { "aria-label": "Animations" };\nconst themeProps: ThemeToggleProps = { defaultChecked: true };\nconst toasterProps: ToasterProps = { position: "bottom-right" };\nvoid (() => toast.success("Saved"));\nexport const counter = <CounterNumbers {...counterProps} />;\nexport const duration = <DurationPill {...durationProps} />;\nexport const email = <EmailMorph {...emailProps} />;\nexport const fluidTabs = <FluidTabs {...fluidTabsProps} />;\nexport const magnet = <MagnetPull {...magnetProps} />;\nexport const morph = <MorphButton {...morphProps} />;\nexport const notify = <NotifyMorph {...notifyProps} />;\nexport const otp = <OtpInput {...otpProps} />;\nexport const ropeTime = <RopeTimePicker {...ropeTimeProps} />;\nexport const search = <SearchMorph {...searchProps} />;\nexport const segment = <SegmentedControl {...segmentProps} />;\nexport const slide = <SlideControl {...slideProps} />;\nexport const spotlight = <SpotlightCard {...spotlightProps} />;\nexport const toggle = <SwitchToggle {...switchProps} />;\nexport const theme = <ThemeToggle {...themeProps} />;\nexport const toaster = <Toaster {...toasterProps} />;\n`,
    );
    await writeFile(
      join(consumerRoot, "src/ssr.tsx"),
      `import { renderToStaticMarkup } from "react-dom/server";\nimport { CounterNumbers, DurationPill, EmailMorph, FluidTabs, MagnetPull, MorphButton, NotifyMorph, OtpInput, RopeTimePicker, SearchMorph, SegmentedControl, SlideControl, SpotlightCard, SwitchToggle, ThemeToggle, Toaster } from "suluu";\n\nconst tabs = [{ value: "inbox", label: "Inbox", icon: <span /> }];\nconst markup = [\n  renderToStaticMarkup(<CounterNumbers value={1284} />),\n  renderToStaticMarkup(<DurationPill defaultValue={{ hours: 2, minutes: 30, seconds: 0 }} />),\n  renderToStaticMarkup(<EmailMorph placeholder="you@example.com" />),\n  renderToStaticMarkup(<FluidTabs aria-label="Workspace" tabs={tabs} />),\n  renderToStaticMarkup(<MagnetPull>Get started</MagnetPull>),\n  renderToStaticMarkup(<MorphButton aria-label="Create new" compactContent={<span>+</span>} expandedContent={<span>Create new</span>} />),\n  renderToStaticMarkup(<NotifyMorph label="Updates" />),\n  renderToStaticMarkup(<OtpInput length={6} name="code" />),\n  renderToStaticMarkup(<RopeTimePicker defaultValue={{ hours: 9, minutes: 30, seconds: 0, period: "AM" }} />),\n  renderToStaticMarkup(<SearchMorph aria-label="Find" />),\n  renderToStaticMarkup(<SegmentedControl aria-label="Range" options={[{ value: "day", label: "Day" }]} />),\n  renderToStaticMarkup(<SlideControl aria-label="Volume" />),\n  renderToStaticMarkup(<SpotlightCard>Quiet light</SpotlightCard>),\n  renderToStaticMarkup(<SwitchToggle aria-label="Animations" />),\n  renderToStaticMarkup(<ThemeToggle defaultChecked />),\n  renderToStaticMarkup(<Toaster />),\n];\nif (markup.some((value) => typeof value !== "string")) throw new Error("SSR did not return markup.");\n`,
    );
    await writeFile(
      join(consumerRoot, "src/index.css"),
      '@import "tailwindcss";\n@import "suluu/styles.css";\n@source "../node_modules/suluu/dist";\n',
    );

    await run(
      "pnpm",
      [
        "install",
        "--ignore-scripts",
        "--frozen-lockfile=false",
        "--strict-peer-dependencies",
      ],
      consumerRoot,
    );
    await run("pnpm", ["exec", "tsc", "--noEmit"], consumerRoot);
    await run(
      resolve(workspaceRoot, "node_modules/.bin/tsx"),
      [join(consumerRoot, "src/ssr.tsx")],
      consumerRoot,
    );

    const installedMotion = JSON.parse(
      await readFile(
        join(consumerRoot, "node_modules/motion/package.json"),
        "utf8",
      ),
    ) as { version?: unknown };
    if (installedMotion.version !== motionVersion) {
      throw new Error(
        `Expected Motion ${motionVersion}, received ${String(installedMotion.version)}.`,
      );
    }

    const installedPackage = JSON.parse(
      await readFile(
        join(consumerRoot, "node_modules/suluu/package.json"),
        "utf8",
      ),
    ) as { exports?: Record<string, unknown>; sideEffects?: unknown };
    for (const exportPath of requiredExports) {
      if (!installedPackage.exports?.[exportPath]) {
        throw new Error(`Packed package is missing the ${exportPath} export.`);
      }
    }
    if (JSON.stringify(installedPackage.sideEffects) !== '["**/*.css"]') {
      throw new Error("Only package CSS should be marked side-effectful.");
    }
    await readFile(
      join(consumerRoot, "node_modules/suluu/dist/styles.css"),
      "utf8",
    );
    process.stdout.write(
      `Packed npm consumer smoke test passed with Motion ${motionVersion}.\n`,
    );
  }
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
