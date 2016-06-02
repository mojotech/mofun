import R from 'ramda';
import T from 'three';

import {WHITE} from './color';
import {calculateHexVertices, hexToPixel} from './hex';

export const generateGrid = (size) => {
  const grid = new T.Object3D();
  const range = R.range(-size, size);
  const geometry = new T.Geometry();
  geometry.vertices = calculateHexVertices();

  const material = new T.LineBasicMaterial({
    color: WHITE,
    opacity: 0.05,
    transparent: true
  });

  grid.userData.geometry = geometry;
  grid.userData.material = material;

  R.forEach((q) =>
            R.forEach((r) => {
              const line = new T.Line(geometry, material);
              line.position.copy(hexToPixel({q, r}));
              grid.add(line);
            }, range), range);

  return grid;
};

export const disposeGrid = (grid) => {
  R.forEach((c) => c.dispose(), grid.children);

  grid.userData.geometry.dispose();
  grid.userData.material.dispose();
  grid.dispose();
};
