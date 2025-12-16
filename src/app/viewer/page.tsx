"use client";

import { useMemo, useState } from "react";
import ProteinPicker from "@/components/viewer/ProteinPicker";
import UploadPdb from "@/components/viewer/UploadPdb";
import ProteinCanvas from "@/components/viewer/ProteinCanvas";
import InfoPanel from "@/components/viewer/InfoPanel";
import { parsePdb } from "@/lib/pdb/pdbParser";
import type { Atom } from "@/lib/pdb/pdbTypes";

type Measure = {
  a: Atom;
  b: Atom;
  distance: number;
};

export default function ViewerPage() {
  const [pdbText, setPdbText] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("");

  const [selectedAtom, setSelectedAtom] = useState<Atom | null>(null);
  const [measure, setMeasure] = useState<Measure | null>(null);

  function handleLoad(text: string, name: string) {
    setPdbText(text);
    setLabel(name);

    // reset UI state when switching proteins
    setSelectedAtom(null);
    setMeasure(null);
  }

  const model = useMemo(() => {
    if (!pdbText) return null;
    return parsePdb(pdbText);
  }, [pdbText]);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-slate-200">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">
          Protein Structure Visualiser
        </h1>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProteinPicker onSelect={handleLoad} />
          <UploadPdb onUpload={handleLoad} />
        </div>

        {/* Viewer + Side Panels */}
        <div className="border border-slate-700 rounded p-4 bg-[#0f1522]">
          {model ? (
            <>
              <p className="font-medium mb-3 text-slate-300">
                Loaded:{" "}
                <span className="text-slate-100">{label}</span>{" "}
                <span className="text-slate-400">
                  — Atoms parsed: {model.atoms.length}
                </span>
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProteinCanvas
                    atoms={model.atoms}
                    onPickAtom={setSelectedAtom}
                    onMeasure={setMeasure}
                  />
                </div>

                <div className="space-y-6">
                  <div className="border border-slate-700 rounded p-4 bg-[#0f1522]">
                    <h2 className="font-semibold text-slate-100 mb-2">
                      Measurement
                    </h2>

                    {!measure ? (
                      <p className="text-slate-400 text-sm">
                        Click two atoms to measure the distance.
                      </p>
                    ) : (
                      <div className="text-sm space-y-1">
                        <p className="text-slate-300">
                          Distance:{" "}
                          <span className="text-slate-100">
                            {measure.distance.toFixed(2)} Å
                          </span>
                        </p>

                        <p className="text-slate-400">
                          A: {measure.a.resName} {measure.a.resSeq} ({measure.a.name}){" "}
                          chain {measure.a.chainID}
                        </p>

                        <p className="text-slate-400">
                          B: {measure.b.resName} {measure.b.resSeq} ({measure.b.name}){" "}
                          chain {measure.b.chainID}
                        </p>
                      </div>
                    )}
                  </div>

                  <InfoPanel atom={selectedAtom} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-400">No protein loaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
