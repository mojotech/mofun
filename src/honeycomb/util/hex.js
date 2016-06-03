import R from 'ramda';

// vertex helpers

const calculateHexVertex = (n) => {
  const angle = 2 * Math.PI / 6 * n;

  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    z: 0
  };
};

export const calculateHexVertices = () =>
  R.map(calculateHexVertex, R.range(1, 7));

// coordinate conversions

// http://www.redblobgames.com/grids/hexagons/
const SQRT3 = Math.sqrt(3);

const cubeToHex = ({x, z}) => ({q: x, r: z});
const hexToCube = ({q, r}) => ({x: q, y: -q-r, z: r});

const cubeRound = ({x, y, z}) => {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rz = Math.round(z);

  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);

  if (dx > dy && dx > dz) {
    return {x: -ry-rz, y: ry, z: rz};
  } else if (dy > dz) {
    return {x: rx, y: -rx-rz, z: rz};
  } else {
    return {x: rx, y: ry, z: -rx-ry};
  }
};

const hexRound = (h) =>
  cubeToHex(cubeRound(hexToCube(h)));

export const pixelToHex = ({x, y}) =>
  hexRound({
    q: x * 2 / 3,
    r: (-x / 3 + SQRT3 / 3 * y)
  });

export const hexToPixel = ({q, r}) => ({
  x: 3 / 2 * r,
  y: SQRT3 * (q + r / 2),
  z: 0
});
