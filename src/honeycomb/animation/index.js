import R from 'ramda';
import T from 'three';
import W from 'tween.js';

import {WHITE} from '../util/color';

import {generateGrid, disposeGrid} from './grid';
import {generatePlane, disposePlane} from './plane';
import {generateBoard, disposeBoard, getTileAtPixel} from './board';

export const generateAnimation = ({container}) => {
  const w = container.clientWidth;
  const h = container.clientHeight;

  const scene = new T.Scene();

  const renderer = new T.WebGLRenderer({antialias: true});
  renderer.setSize(w, h);
  renderer.setClearColor(WHITE);

  const camera = new T.PerspectiveCamera(75, w / h, 0.1, 1000);
  camera.position.set(0, -5, 20);
  camera.lookAt(scene.position);

  const light = new T.PointLight(WHITE, 1);
  light.position.set(0, -5, 15);

  const plane = generatePlane();
  plane.position.set(0, 0, -0.1);

  const grid = generateGrid(50);
  const board = generateBoard(50);

  const raycaster = new T.Raycaster();
  const planeZ = new T.Plane(new T.Vector3(0, 0, 1), 0);

  scene.add(camera);
  scene.add(grid);
  scene.add(board);
  scene.add(light);
  scene.add(plane);

  container.appendChild(renderer.domElement);

  return {container, renderer, camera, grid, board, light, plane, planeZ, raycaster, scene};
};

export const disposeAnimation = ({container, renderer, camera, grid, board, light, plane, planeZ, raycaster, scene}) => {
  container.removeChild(renderer.domElement);

  disposeGrid(grid);
  disposeBoard(board);
  disposePlane(plane);
  renderer.dispose();
};

export const getTileUnderMouse = ({raycaster, planeZ, camera, board}, mouse) => {
  if(mouse) {
    raycaster.setFromCamera(mouse, camera);

    return getTileAtPixel(board, raycaster.ray.intersectPlane(planeZ));
  } else {
    return null;
  }
};

export const renderAnimationFrame = ({renderer, scene, camera}, t) => {
  W.update(t);
  renderer.render(scene, camera);
};

export const positionLight = ({light}, {x, y}) => {
  light.position.x = x;
  light.position.y = y;
};

export const positionCamera = ({camera, scene}, {x, y}) => {
  camera.position.x = x;
  camera.position.y = y;
  camera.lookAt(scene.position);
};

export const resizeRenderer = ({renderer, camera}, c)  => {
  camera.aspect = c.width / c.height;
  camera.updateProjectionMatrix();
  renderer.setSize(c.width, c.height);
};

export const enterTile = (a, t) => {
  if(t) {
    t.material.opacity = 0.3;
    t.scale.set(0.6, 0.6, 1);
    R.forEach((t) => t.stop(), t.userData.tweens || []);
    t.userData.tweens = [
      new W.Tween(t.scale)
        .to({x: [0.8, 0.6], y: [0.8, 0.6]}, 600)
        .easing(W.Easing.Quadratic.Out)
        .repeat(Infinity)
        .yoyo()
        .onStart(() => t.visible = true)
        .start(),
      new W.Tween(t.material)
        .to({opacity: [0.3, 0.2]}, 600)
        .easing(W.Easing.Quadratic.Out)
        .repeat(Infinity)
        .yoyo()
        .start()
    ];
  }
};

export const exitTile = (a, t) => {
  if(t) {
    R.forEach((t) => t.stop(), t.userData.tweens || []);
    t.userData.tweens = [
      new W.Tween(t.scale)
        .easing(W.Easing.Quadratic.Out)
        .to({x: 0.02, y: 0.02}, 600)
        .start(),
      new W.Tween(t.material)
        .easing(W.Easing.Quadratic.Out)
        .to({opacity: 0.1}, 600)
        .onComplete(() => t.visible = false)
        .start()
    ];
  }
};
