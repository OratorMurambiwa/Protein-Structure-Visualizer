import type { Atom, PdbModel } from "./pdbTypes";

function safeInt(s: string) {
  const n = parseInt(s.trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function safeFloat(s: string) {
  const n = parseFloat(s.trim());
  return Number.isFinite(n) ? n : 0;
}

function guessElement(atomName: string) {
  // PDB element column is best, but some files are messy.
  // Atom name often starts with the element (e.g., " CA ", " N  ", " O  ")
  const t = atomName.trim();
  const first = t[0] ?? "";
  const second = t[1] ?? "";

  // Handle common 2-letter elements if they appear (rare in proteins)
  const two = (first + second).toUpperCase();
  if (two === "CL" || two === "NA" || two === "MG" || two === "ZN" || two === "CA") {
    return two;
  }
  return first.toUpperCase();
}

export function parsePdb(pdbText: string): PdbModel {
  const atoms: Atom[] = [];

  const lines = pdbText.split(/\r?\n/);
  for (const line of lines) {
    const record = line.slice(0, 6).trim();
    if (record !== "ATOM" && record !== "HETATM") continue;

    // PDB fixed-width columns:
    // serial: 7-11
    // atom name: 13-16
    // res name: 18-20
    // chain: 22
    // res seq: 23-26
    // x: 31-38, y: 39-46, z: 47-54
    // element: 77-78
    const serial = safeInt(line.slice(6, 11));
    const name = line.slice(12, 16);
    const resName = line.slice(17, 20).trim();
    const chainID = line.slice(21, 22).trim() || "?";
    const resSeq = safeInt(line.slice(22, 26));
    const x = safeFloat(line.slice(30, 38));
    const y = safeFloat(line.slice(38, 46));
    const z = safeFloat(line.slice(46, 54));

    const elementRaw = line.slice(76, 78).trim();
    const element = elementRaw ? elementRaw.toUpperCase() : guessElement(name);

    atoms.push({
      serial,
      name: name.trim(),
      resName,
      chainID,
      resSeq,
      x,
      y,
      z,
      element,
    });
  }

  return { atoms };
}
