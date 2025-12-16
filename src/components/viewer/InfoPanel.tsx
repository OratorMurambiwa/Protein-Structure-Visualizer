"use client";

import type { Atom } from "@/lib/pdb/pdbTypes";

type Props = {
  atom: Atom | null;
};

export default function InfoPanel({ atom }: Props) {
  return (
    <div className="border border-slate-700 rounded p-4 bg-[#0f1522] text-slate-200">
      <h2 className="font-semibold text-slate-100 mb-2">Selection</h2>

      {!atom ? (
        <p className="text-slate-400">Click an atom to see details.</p>
      ) : (
        <div className="space-y-1 text-sm">
          <p><span className="text-slate-400">Element:</span> {atom.element}</p>
          <p><span className="text-slate-400">Atom:</span> {atom.name}</p>
          <p><span className="text-slate-400">Residue:</span> {atom.resName} {atom.resSeq}</p>
          <p><span className="text-slate-400">Chain:</span> {atom.chainID}</p>
          <p className="pt-2 text-slate-300">
            <span className="text-slate-400">Position:</span>{" "}
            ({atom.x.toFixed(2)}, {atom.y.toFixed(2)}, {atom.z.toFixed(2)})
          </p>
        </div>
      )}
    </div>
  );
}
