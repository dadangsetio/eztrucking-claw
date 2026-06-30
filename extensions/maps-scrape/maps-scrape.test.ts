import { describe, expect, it } from "vitest";
import { candidatesFromCsv, parseCsv } from "./index.js";

describe("parseCsv", () => {
  it("handles quoted fields with commas, embedded newlines, and escaped quotes", () => {
    const csv = 'a,b,c\n"x, y","line1\nline2","say ""hi"""\n';
    const rows = parseCsv(csv);
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["x, y", "line1\nline2", 'say "hi"'],
    ]);
  });
});

describe("candidatesFromCsv", () => {
  const header = "title,category,address,website,phone";
  it("maps columns by name and drops rows without a phone", () => {
    const csv =
      `${header}\n` +
      'Maju Cargo,Freight forwarding service,"Jl. Raya 1, Surabaya",https://maju.id,+62 31 111\n' +
      "No Phone Co,Trucking,Jl. Sepi,https://nophone.id,\n";
    const out = candidatesFromCsv(csv, 30);
    expect(out).toEqual([
      {
        name: "Maju Cargo",
        phone: "+62 31 111",
        region: "Jl. Raya 1, Surabaya",
        website: "https://maju.id",
        service: "Freight forwarding service",
      },
    ]);
  });

  it("respects maxResults", () => {
    const csv =
      `${header}\n` +
      "A,Trucking,Addr,,+62 1\n" +
      "B,Trucking,Addr,,+62 2\n" +
      "C,Trucking,Addr,,+62 3\n";
    expect(candidatesFromCsv(csv, 2)).toHaveLength(2);
  });
});
