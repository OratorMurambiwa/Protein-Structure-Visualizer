export type BuiltInProtein = {
  id: string;
  name: string;
  filename: string;
  description: string;
};

export const BUILT_IN_PROTEINS: BuiltInProtein[] = [
  {
    id: "1MBN",
    name: "Myoglobin",
    filename: "1MBN.pdb",
    description: "Oxygen-binding protein in muscle tissue",
  },
  {
    id: "1LYZ",
    name: "Lysozyme",
    filename: "1LYZ.pdb",
    description: "Enzyme that breaks down bacterial cell walls",
  },
  {
    id: "3I40",
    name: "Insulin",
    filename: "3I40.pdb",
    description: "Human insulin hormone structure",
  },
  {
    id: "1CRN",
    name: "Crambin",
    filename: "1CRN.pdb",
    description: "Very small protein from the plant Crambe abyssinica",
  },
];
