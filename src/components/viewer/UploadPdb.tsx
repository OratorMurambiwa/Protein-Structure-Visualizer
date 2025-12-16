"use client";

type Props = {
  onUpload: (pdbText: string, label: string) => void;
};

export default function UploadPdb({ onUpload }: Props) {
  function handleFile(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpload(reader.result, file.name);
      }
    };

    reader.readAsText(file);
  }

  return (
    <div className="space-y-2">
      <label className="block font-medium text-slate-200">
        Upload Your Own PDB
      </label>

      <input
        type="file"
        accept=".pdb"
        className="
          block w-full text-sm
          text-slate-300
          file:mr-4 file:py-2 file:px-4
          file:rounded
          file:border-0
          file:bg-[#121826]
          file:text-slate-200
          hover:file:bg-[#1a2133]
        "
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <p className="text-xs text-slate-400">
        Upload any <span className="text-slate-300">.pdb</span> file from the Protein Data Bank.
      </p>
    </div>
  );
}
