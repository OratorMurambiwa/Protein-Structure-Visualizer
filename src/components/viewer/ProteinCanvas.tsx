"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Atom } from "@/lib/pdb/pdbTypes";

type Measure = {
  a: Atom;
  b: Atom;
  distance: number;
};

type Props = {
  atoms: Atom[];
  onPickAtom?: (atom: Atom | null) => void;
  onMeasure?: (m: Measure | null) => void;
};

function elementColor(element: string) {
  switch (element.toUpperCase()) {
    case "C":
      return 0x9e9e9e;
    case "N":
      return 0x3050f8;
    case "O":
      return 0xff0d0d;
    case "S":
      return 0xffff30;
    case "H":
      return 0xffffff;
    case "P":
      return 0xff8000;
    default:
      return 0x00c853;
  }
}

function dist(a: Atom, b: Atom) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export default function ProteinCanvas({ atoms, onPickAtom, onMeasure }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const positions = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    for (const a of atoms) {
      minX = Math.min(minX, a.x);
      maxX = Math.max(maxX, a.x);
      minY = Math.min(minY, a.y);
      maxY = Math.max(maxY, a.y);
      minZ = Math.min(minZ, a.z);
      maxZ = Math.max(maxZ, a.z);
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;

    const centered = atoms.map((a) => ({
      ...a,
      x: a.x - cx,
      y: a.y - cy,
      z: a.z - cz,
    }));

    const radius =
      Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2 || 50;

    return { centered, radius, center: { cx, cy, cz } };
  }, [atoms]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    mount.innerHTML = "";

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f14);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000);
    camera.position.set(0, 0, positions.radius * 2.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting (keep your current setup)
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 2, 2);
    scene.add(dir);

    // Instanced atoms
    const byElement = new Map<string, Atom[]>();
    for (const a of positions.centered) {
      const key = a.element.toUpperCase();
      if (!byElement.has(key)) byElement.set(key, []);
      byElement.get(key)!.push(a);
    }

    const baseSphere = new THREE.SphereGeometry(0.35, 16, 16);

    const meshes: THREE.InstancedMesh[] = [];
    const instanceAtoms = new Map<THREE.InstancedMesh, Atom[]>();

    for (const [element, list] of byElement.entries()) {
      const mat = new THREE.MeshStandardMaterial({
        color: elementColor(element),
        roughness: 0.55,
        metalness: 0.0,
      });

      const mesh = new THREE.InstancedMesh(baseSphere, mat, list.length);

      const m = new THREE.Matrix4();
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        m.makeTranslation(a.x, a.y, a.z);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;

      scene.add(mesh);
      meshes.push(mesh);
      instanceAtoms.set(mesh, list);
    }

    // Selection markers (A and B)
    const markerGeo = new THREE.SphereGeometry(0.7, 20, 20);
    const markerMatA = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x005a66,
      emissiveIntensity: 0.65,
      roughness: 0.35,
      metalness: 0.0,
    });
    const markerMatB = new THREE.MeshStandardMaterial({
      color: 0xff4d4d,
      emissive: 0x660000,
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.0,
    });

    const markerA = new THREE.Mesh(markerGeo, markerMatA);
    const markerB = new THREE.Mesh(markerGeo, markerMatB);
    markerA.visible = false;
    markerB.visible = false;
    scene.add(markerA);
    scene.add(markerB);

    // Measurement line
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const line = new THREE.Line(lineGeom, lineMat);
    line.visible = false;
    scene.add(line);

    let pickedA: Atom | null = null;
    let pickedB: Atom | null = null;

    function clearMeasure() {
      pickedA = null;
      pickedB = null;
      markerA.visible = false;
      markerB.visible = false;
      line.visible = false;
      onPickAtom?.(null);
      onMeasure?.(null);
    }

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerDown(ev: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshes, false);

      if (hits.length === 0) {
        clearMeasure();
        return;
      }

      const hit = hits[0];
      const hitMesh = hit.object as THREE.InstancedMesh;
      const instanceId = hit.instanceId;

      if (instanceId === undefined) return;

      const list = instanceAtoms.get(hitMesh);
      const centeredAtom = list ? list[instanceId] : null;
      if (!centeredAtom) return;

      // Map back to original atom for UI (coords, residue info)
      const originalAtom =
        atoms.find((a) => a.serial === centeredAtom.serial) ?? centeredAtom;

      // Two-click logic:
      // - first click sets A
      // - second click sets B and measures
      // - third click starts a new measurement (A resets)
      if (!pickedA || (pickedA && pickedB)) {
        pickedA = centeredAtom;
        pickedB = null;

        markerA.position.set(centeredAtom.x, centeredAtom.y, centeredAtom.z);
        markerA.visible = true;

        markerB.visible = false;
        line.visible = false;

        onPickAtom?.(originalAtom);
        onMeasure?.(null);
        return;
      }

      // second point
      pickedB = centeredAtom;

      markerB.position.set(centeredAtom.x, centeredAtom.y, centeredAtom.z);
      markerB.visible = true;

      // Update line geometry
      const p1 = new THREE.Vector3(pickedA.x, pickedA.y, pickedA.z);
      const p2 = new THREE.Vector3(pickedB.x, pickedB.y, pickedB.z);
      line.geometry.setFromPoints([p1, p2]);
      line.visible = true;

      // Distance computed in centered space = same as original distance
      const d = dist(pickedA, pickedB);

      // send to UI using original atoms (more meaningful metadata)
      const aOrig = atoms.find((a) => a.serial === pickedA!.serial) ?? pickedA!;
      const bOrig = atoms.find((a) => a.serial === pickedB!.serial) ?? pickedB!;

      onPickAtom?.(originalAtom);
      onMeasure?.({
        a: aOrig,
        b: bOrig,
        distance: d,
      });
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    let animId = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);

      controls.dispose();
      renderer.dispose();

      baseSphere.dispose();
      markerGeo.dispose();
      markerMatA.dispose();
      markerMatB.dispose();
      lineMat.dispose();
      lineGeom.dispose();

      for (const mesh of meshes) {
        (mesh.material as THREE.Material).dispose();
        mesh.dispose();
      }
    };
  }, [positions, atoms, onPickAtom, onMeasure]);

  return (
    <div
      className="w-full h-[520px] border border-slate-700 rounded overflow-hidden bg-[#0b0f14]"
      ref={mountRef}
    />
  );
}
