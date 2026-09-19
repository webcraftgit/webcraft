import * as THREE from "three";

/**
 * The Webcraft "W" mark — traced programmatically from the source logo
 * (OpenCV contour extraction, simplified). Design space: 300 x 169, Y-down.
 * The top-right edge steps like pixels, echoing the dissolve in the source mark.
 */
const W_OUTLINE: [number, number][] = [
  [287.4, 20.2], // top-right shoulder
  // stepped pixel-dissolve edge
  [292, 9], [280, 9], [283, 21], [267, 25], [263, 13], [246, 11],
  [204.2, 68.1], // right inner valley
  [168.9, 7.6],  // middle peak
  [110.9, 5.0],
  [126.1, 47.9], // overlap notch between strokes
  [100.8, 75.6],
  [60.5, 7.6],
  [0.0, 5.0],    // top-left
  [90.8, 166.4], // bottom-left vertex
  [116.0, 163.9],
  [151.3, 95.8], // middle valley
  [191.6, 161.3],
  [219.3, 163.9], // bottom-right vertex
];

const CX = 150;
const CY = 84.5;

/** Detached pixel squares from the source logo: [x, y, size] in design space */
export const FRAGMENTS: [number, number, number][] = [
  [307.6, -45.4, 15.1],
  [277.3, -25.2, 12.6],
  [257.1, -12.6, 12.6],
  [300.0, -12.6, 12.6],
];

export function toScene(x: number, y: number): [number, number] {
  return [x - CX, CY - y]; // center + flip Y (design space is Y-down)
}

export function getLogoShape(): THREE.Shape {
  const s = new THREE.Shape();
  W_OUTLINE.forEach(([x, y], i) => {
    const [px, py] = toScene(x, y);
    if (i === 0) s.moveTo(px, py);
    else s.lineTo(px, py);
  });
  s.closePath();
  return s;
}
