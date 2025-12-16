"use client";

import { BUILT_IN_PROTEINS } from "@/lib/pdb/pdbCatalog";

type Props = {
  onSelect: (pdbText: string, label: string) => void;
};

export default function ProteinPicker({ onSelect }: Props) {
  async function handleSelect(id: string) {
    if (!id) return;

    const protein = BUILT_IN_PROTEINS.find((p) => p.id === id);
    if (!protein) return;

    const res = await fetch(`/proteins/${protein.filename}`);
    const text = await res.text();

    onSelect(text, `${protein.name} (${protein.id})`);
  }

  return (
    <div className="space-y-2">
      <label className="block font-medium text-slate-200">
        Built-in Proteins
      </label>

      <select
        className="
          w-full p-2 rounded
          bg-[#121826] text-slate-200
          border border-slate-600
          focus:outline-none focus:ring-2 focus:ring-sky-500
        "
        defaultValue=""
        onChange={(e) => handleSelect(e.target.value)}
      >
        <option value="" disabled className="bg-[#121826] text-slate-400">
          Select a protein…
        </option>

        {BUILT_IN_PROTEINS.map((p) => (
          <option
            key={p.id}
            value={p.id}
            className="bg-[#121826] text-slate-200"
          >
            {p.name} ({p.id})
          </option>
        ))}
      </select>

      <p className="text-xs text-slate-400">
        Loads sample PDB files from <span className="text-slate-300">/public/proteins</span>.
      </p>
    </div>
  );
}
