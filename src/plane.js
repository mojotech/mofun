import T from 'three';

import {PURPLE, WHITE} from './color';

export const generatePlane = () =>
  new T.Mesh(
    new T.PlaneBufferGeometry(100, 100, 32, 32),
    new T.MeshLambertMaterial({
      color: PURPLE,
      emissive: WHITE,
      emissiveIntensity: 0.2
    })
  );

export const disposePlane = (plane) => {
  plane.geometry.dispose();
  plane.material.dispose();
  plane.dispose();
};
