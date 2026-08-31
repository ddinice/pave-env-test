import { describe, expect, it } from "vitest";

import { fillEnv, parseEnv } from "../../app/pull/env";

const registry = {
  "EPS-BUS-VOLTAGE": { value: "28", subsystem: "EPS" },
  "EPS-PEAK-LOAD": { value: "142", subsystem: "EPS" },
};

describe("parseEnv", () => {
  it("splits a bare key, a key=value entry, a comment and a blank line into distinct line types", () => {
    const lines = parseEnv(
      "STR-PRIMARY-MASS\nEPS-BUS-VOLTAGE=28\n# a comment\n",
    );
    expect(lines).toEqual([
      { type: "entry", key: "STR-PRIMARY-MASS", value: "" },
      { type: "entry", key: "EPS-BUS-VOLTAGE", value: "28" },
      { type: "raw", text: "# a comment" },
      { type: "raw", text: "" },
    ]);
  });
});

describe("fillEnv", () => {
  it("is idempotent: filling a file whose values already match the registry returns byte-identical text", () => {
    const text = "EPS-BUS-VOLTAGE=28\nEPS-PEAK-LOAD=142";
    expect(fillEnv(parseEnv(text), registry).output).toBe(text);
  });

  it("carries comments, blank lines and key order through untouched", () => {
    const text = [
      "# Electrical power system",
      "EPS-BUS-VOLTAGE=",
      "",
      "EPS-PEAK-LOAD=",
    ].join("\n");
    const expected = [
      "# Electrical power system",
      "EPS-BUS-VOLTAGE=28",
      "",
      "EPS-PEAK-LOAD=142",
    ].join("\n");
    expect(fillEnv(parseEnv(text), registry).output).toBe(expected);
  });

  it("comments out a key that isn't in the registry rather than leaving it, blanking it, or dropping it", () => {
    const { output, stats } = fillEnv(
      parseEnv("GHOST-KEY=1\nEPS-BUS-VOLTAGE=1"),
      registry,
    );
    expect(output).toBe("#GHOST-KEY=1\nEPS-BUS-VOLTAGE=28");
    expect(stats.notFound).toEqual(["GHOST-KEY"]);
  });

  it("replaces a matched key's whole value wholesale — no quoting, export-prefix, or inline-comment handling exists", () => {
    expect(fillEnv(parseEnv('EPS-BUS-VOLTAGE="1"'), registry).output).toBe(
      "EPS-BUS-VOLTAGE=28",
    );
    expect(
      fillEnv(parseEnv("EPS-BUS-VOLTAGE=1 # keep me"), registry).output,
    ).toBe("EPS-BUS-VOLTAGE=28");
    expect(fillEnv(parseEnv("export EPS-BUS-VOLTAGE=1"), registry).output).toBe(
      "#export EPS-BUS-VOLTAGE=1",
    );
  });

  it("flags a filled value that differs from what was already on the line as stale, without changing the output", () => {
    const { output, stats } = fillEnv(parseEnv("EPS-BUS-VOLTAGE=1"), registry);
    expect(output).toBe("EPS-BUS-VOLTAGE=28");
    expect(stats.stale).toEqual(["EPS-BUS-VOLTAGE"]);
  });

  it("groups filled entries by subsystem and moves not-found keys into a trailing section when formatted", () => {
    const { output } = fillEnv(
      parseEnv("EPS-BUS-VOLTAGE=\nGHOST-KEY=\nEPS-PEAK-LOAD="),
      registry,
      true,
    );
    expect(output).toBe(
      "#EPS\nEPS-BUS-VOLTAGE=28\nEPS-PEAK-LOAD=142\n\n# Not found\n#GHOST-KEY=",
    );
  });

  it("round-trips: feeding a filled file back in a second time changes nothing further", () => {
    const first = fillEnv(
      parseEnv("EPS-BUS-VOLTAGE=\nGHOST-KEY=\nEPS-PEAK-LOAD="),
      registry,
    );
    const second = fillEnv(parseEnv(first.output), registry);
    expect(second.output).toBe(first.output);
  });
});
