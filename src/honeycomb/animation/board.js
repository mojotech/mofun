import R from 'ramda';
import T from 'three';
import W from 'tween.js';

import {WHITE} from '../util/color';
import {calculateHexVertices, hexToPixel, pixelToHex} from '../util/hex';

const generateHex = () => {
  const s = new T.Shape();
  const vs = calculateHexVertices();

  s.moveTo(vs[0].x, vs[0].y);
  R.forEach(
    (i) => s.lineTo(vs[i].x, vs[i].y),
    [1, 2, 3, 4, 5, 0]
  );

  return s;
};

const generateTile = (size, q, r, z, geometry) => {
  const mesh = new T.Mesh(
    geometry,
    // need a new material per tile so we can vary alpha per tile
    new T.MeshLambertMaterial({
      color: WHITE,
      emissive: WHITE,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.3
    }));
  mesh.position.copy(hexToPixel({q, r}));
  mesh.visible = false;

  return mesh;
};

export const generateBoard = (size) => {
  const board = new T.Object3D();
  const range = R.range(-size, size);
  const hexagon = generateHex();
  const geometry = new T.ShapeGeometry(hexagon);

  board.userData.tiles = [];
  board.userData.hexagon = hexagon;
  board.userData.geometry = geometry;

  R.forEach((q) =>
    R.forEach((r) => {
      const tile = generateTile(1, q, r, 0.1, geometry);
      board.add(tile);
      board.userData.tiles[r] = board.userData.tiles[r] || [];
      board.userData.tiles[r][q] = tile;
    }, range), range);

  return board;
};

export const disposeBoard = (board) => {
  R.forEach((c) => {
    c.material.dispose();
    c.dispose();
  }, board.children);

  board.userData.hexagon.dispose();
  board.userData.geometry.dispose();
  board.dispose();
};

export const getTileAtPixel = (board, pixel) => {
  const hex = pixelToHex(pixel);
  return board.userData.tiles[hex.q][hex.r];
};
