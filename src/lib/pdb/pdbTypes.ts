export type Atom = {
  serial: number;
  name: string;
  resName: string;
  chainID: string;
  resSeq: number;
  x: number;
  y: number;
  z: number;
  element: string;
};

export type PdbModel = {
  atoms: Atom[];
};
