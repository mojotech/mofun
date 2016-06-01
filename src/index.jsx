import R from 'ramda';
import T from 'three';
import W from 'tween.js';
import F from 'flyd';

const GREEN = 0x28ba00;
const PURPLE = 0x6500b3;
const ORANGE = 0xe65626;
const WHITE = 0xffffff;
const BLACK = 0x000000;
const SQRT3 = Math.sqrt(3);

const w = window.innerWidth;
const h = window.innerHeight;

const renderer = new T.WebGLRenderer({
  antialias: true
});
const camera = new T.PerspectiveCamera(75, w / h, 0.1, 1000);
const scene = new T.Scene();

const hexToPixel = ({q, r}) => {
  return new T.Vector3(3 / 2 * r, SQRT3 * (q + r / 2), 0);
};

const generateHexagonVertex = (n) => {
  const angle = 2 * Math.PI / 6 * n;
  return new T.Vector3(Math.cos(angle), Math.sin(angle), 0);
};

const generateHexagonVertices = () =>
  R.map(generateHexagonVertex, R.range(1, 7));

const generateHexagon = () => {
  const s = new T.Shape();
  const vs = generateHexagonVertices(1);

  s.moveTo(vs[0].x, vs[0].y);
  R.forEach(
    (i) => s.lineTo(vs[i].x, vs[i].y),
    [1, 2, 3, 4, 5, 0]
  );

  return s;
};

// grid helpers

const gridGeometry = new T.Geometry();
gridGeometry.vertices = generateHexagonVertices();

const gridMaterial = new T.LineBasicMaterial({
  color: WHITE,
  opacity: 0.05,
  transparent: true
});

const generateGrid = (size) => {
  const grid = new T.Object3D();
  const range = R.range(-size, size);

  R.forEach((q) =>
    R.forEach((r) => {
      const line = new T.Line(gridGeometry, gridMaterial);
      line.position.copy(hexToPixel({q, r}));
      grid.add(line);
    }, range), range);

  return grid;
};

//

const cellGeometry = new T.ShapeGeometry(
  generateHexagon()
);

const cellMaterial = new T.MeshLambertMaterial({
  color: PURPLE,
  emissive: WHITE,
  emissiveIntensity: 0.2
});

const generateCell = (size, q, r, z = 0) => {
  const mesh = new T.Mesh(cellGeometry, cellMaterial);
  mesh.position.copy(hexToPixel({q, r}));
  return mesh;
};

const generateTile = (size, q, r, z = 0.1) => {
  const mesh = new T.Mesh(
    cellGeometry,
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
  mesh.scale.set(0.6, 0.6, 1);
  return mesh;
};

const generateBoard = (size) => {
  const board = new T.Object3D();
  const range = R.range(-size, size);

  board.userData.cells = [];
  board.userData.tiles = [];

  R.forEach((q) =>
    R.forEach((r) => {
      /* const cell = generateCell(1, q, r);*/
      const tile = generateTile(1, q, r);
      /* cell.userData.tile = tile;*/
      /* board.add(cell);*/
      board.add(tile);
      /* board.userData.cells.push(cell);
       */
      board.userData.tiles[r] = board.userData.tiles[r] || [];
      board.userData.tiles[r][q] = tile;

    }, range), range);

  return board;
};

const planeGeometry = new T.PlaneBufferGeometry(100, 100, 32, 32);

/* planeGeometry.computeFaceNormals();
 * planeGeometry.computeVertexNormals();
 * */

const plane = new T.Mesh(
  planeGeometry,
  new T.MeshLambertMaterial({
    color: PURPLE,
    emissive: WHITE,
    emissiveIntensity: 0.2
  })
);

plane.position.set(0, 0, -0.1);

const grid = generateGrid(50);
const board = generateBoard(50);

camera.position.set(0, -5, 20);
camera.lookAt(scene.position);

const light = new T.PointLight(WHITE, 1);
light.position.set(0, -5, 15);

scene.add(camera);
scene.add(grid);
scene.add(board);
scene.add(light);
scene.add(plane);

renderer.setSize(w, h);
renderer.setClearColor(WHITE, 1);

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

const pixelToHex = ({x, y}) =>
  hexRound({
    q: x * 2 / 3,
    r: (-x / 3 + SQRT3 / 3 * y)
  });

document.getElementById('root').appendChild(renderer.domElement);

const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', onResize, false);

const mouse = new T.Vector3();
mouse.userData = mouse.userData || {};
mouse.userData.over = false;

const onMouseMove = (e) => {
  mouse.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    - (e.clientY / window.innerHeight) * 2 + 1,
    0
  );

  const cameraTo = {x: mouse.x, y: mouse.y - 5};
  const lightTo = {x: 5 * -mouse.x, y: 5 * -mouse.y};

  lightTweens.x && lightTweens.x.stop();
  lightTweens.x = new W.Tween(light.position)
                       .to({x: lightTo.x}, Math.abs(light.position.x - lightTo.x) / 1)
                       .start();
  cameraTweens.x && cameraTweens.x.stop();
  cameraTweens.x = new W.Tween(camera.position)
                        .onUpdate(() => camera.lookAt(scene.position))
                        .to({x: cameraTo.x}, Math.abs(camera.position.x - cameraTo.x) / 0.5)
                        .start();

  lightTweens.y && lightTweens.y.stop();
  lightTweens.y = new W.Tween(light.position)
                       .to({y: lightTo.y}, Math.abs(light.position.y - lightTo.y) / 1)
                       .start();

  cameraTweens.y && cameraTweens.y.stop();
  cameraTweens.y = new W.Tween(camera.position)
                        .onUpdate(() => camera.lookAt(scene.position))
                        .to({y: cameraTo.y}, Math.abs(camera.position.y - cameraTo.y) / 0.5)
                        .start();

};

const onMouseOver = (e) => mouse.userData.over = true;
const onMouseOut = (e) => mouse.userData.over = false;

window.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseover', onMouseOver, false);
renderer.domElement.addEventListener('mouseout', onMouseOut, false);

const raycaster = new T.Raycaster();
const planeZ = new T.Plane(new T.Vector3(0, 0, 1), 0);

const transitioning = new Set();

const enterTile = (tile, time) => {
  tile.userData.transitions = [
    {
      start: time,
      duration: 100,
      from: 0.6,
      to: 0.94,
      get: () => tile.scale.x,
      set: (n) => tile.scale.set(n, n, 1),
      onStart: () => tile.visible = true
    },
    {
      start: time,
      duration: 100,
      from: 0.2,
      to: 0.3,
      get: () => tile.material.opacity,
      set: (n) => tile.material.opacity = n,
      onEnd: (time) => {
        tile.userData.transitions = [
          {
            start: time,
            duration: 400,
            from: 0.94,
            to: 0.6,
            get: () => tile.scale.x,
            set: (n) => tile.scale.set(n, n, 1)
          },
          {
            start: time,
            duration: 400,
            from: 0.3,
            to: 0.2,
            get: () => tile.material.opacity,
            set: (n) => tile.material.opacity = n,
            onEnd: (time) => enterTile(tile, time)
          }
        ];

        return false;
      }
    }
  ];

  /* console.log(tile);
   */
  transitioning.add(tile);
};

const exitTile = (tile, time) => {
  tile.userData.transitions = [
    {
      start: time,
      duration: 1000,
      from: tile.scale.x,
      to: 0.02,
      get: () => tile.scale.x,
      set: (n) => tile.scale.set(n, n, 1)
    },
    {
      start: time,
      duration: 1000,
      from: tile.material.opacity,
      to: 0.05,
      get: () => tile.material.opacity,
      set: (n) => tile.material.opacity = n,
      onEnd: () => tile.visible = false
    }
  ];

  transitioning.add(tile);
};

const transitionBySpeed = (t, time) => {
  const current = t.get();

  if (current < t.to) {
    return t.to - current < t.speed ? t.to : current + t.speed;
  } else {
    return current - t.to < t.speed ? t.to : current - t.speed;
  }
};

const transitionByDuration = (t, time) =>
  t.from + (t.to - t.from) * (Math.min(time - t.start, t.duration) / t.duration);

const toFixed = (n, places = 2) =>
  Math.round(n * 10 * places) / (10 * places);

const transition = (o, time) => {
  const ts = o.userData.transitions;
  const didEnd = ts.reduce((didEnd, t) => {
    if (time == t.start) {
      t.onStart && t.onStart(time);
    }

    if (toFixed(t.get()) === toFixed(t.to)) {
      if (t.onEnd) {
        return (t.onEnd(time) !== false) && didEnd;
      } else {
        return didEnd;
      }
    } else {
      if(t.speed) {
        t.set(transitionBySpeed(t, time));
      } else if (t.duration) {
        t.set(transitionByDuration(t, time));
      }
      return false;
    }
  }, true);

  didEnd && transitioning.delete(o);
};

const transitionLight = (time) => {
  if(toFixed(light.position.x) !== toFixed(5 * -mouse.x) ||
     toFixed(light.position.y) !== toFixed(5 * -mouse.y)) {
       light.userData.transitions = [
         {
           start: time,
           speed: 0.5,
           to: 5 * -mouse.x,
           get: () => light.position.x,
           set: (n) => light.position.x = n
         },
         {
           start: time,
           speed: 0.5,
           to: 5 * -mouse.y,
           get: () => light.position.y,
           set: (n) => light.position.y = n
         }
       ];

       transitioning.add(light);
  }
};

const transitionCamera = (time) => {
  if(toFixed(camera.position.x) !== toFixed(mouse.x) ||
     toFixed(camera.position.y) !== toFixed(mouse.y - 5)) {
       camera.userData.transitions = [
         {
           start: time,
           speed: 0.1,
           to: mouse.x,
           get: () => camera.position.x,
           set: (n) => {
             camera.position.x = n;
             camera.lookAt(scene.position);
           }
         },
         {
           start: time,
           speed: 0.1,
           to: -5 + mouse.y,
           get: () => camera.position.y,
           set: (n) => {
             camera.position.y = n;
             camera.lookAt(scene.position);
           }
         }
       ];

       transitioning.add(camera);
  }
};

const getTileUnderMouse = () => {
  raycaster.setFromCamera(mouse, camera);
  const hex = pixelToHex(raycaster.ray.intersectPlane(planeZ));

  return board.userData.tiles[hex.q][hex.r];
};


const lightTweens = {};
const cameraTweens = {};




const update = (time) => {

  if(mouse.userData.over) {
    const tile = getTileUnderMouse();

    if (mouse.userData.tile !== tile) {
      enterTile(tile, time);
      mouse.userData.tile && exitTile(mouse.userData.tile, time);
      mouse.userData.tile = tile;
    }
  } else if (mouse.userData.tile) {
    exitTile(mouse.userData.tile, time);
    mouse.userData.tile = null;
  }

  for (let t of transitioning) {
    transition(t, time);
  }

  W.update(time);
  renderer.render(scene, camera);
  requestAnimationFrame(update);
};

update();
