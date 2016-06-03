import R from 'ramda';
import F from 'flyd';

import {createSteppedPositionStream} from './util/stream';

const createContainerMeasurementsStream = (container, windowResize) =>
  windowResize.map(() => ({
    w: container.clientWidth,
    h: container.clientHeight,
    x: container.offsetLeft,
    y: container.offsetTop
  }));

const createMousePositionStream = (mouseMove, mouseOver, containerMeasurements) =>
  F.combine((mouse, over, container, self) => {
    const m = mouse();
    const c = container();

    if(over()) {
      self({
        x: ((m.clientX - c.x) / c.w) * 2 - 1,
        y: - ((m.clientY - c.y) / c.h) * 2 + 1
      });
    }
  }, [mouseMove, mouseOver, containerMeasurements]);

const createCameraToPositionStream = (mousePosition) =>
  mousePosition.map((m) => ({
    x: m.x,
    y: m.y - 5
  }));

const createLightToPositionStream = (mousePosition) =>
  mousePosition.map((m) => ({
    x: 5 * -m.x,
    y: 5 * -m.y
  }));

const createEnteredTileStream = (getTileUnderMouse, mouseOut, mousePosition) =>
  F.transduce(
    R.compose(R.map(getTileUnderMouse), R.dropRepeats),
    F.merge(mouseOut, mousePosition)
  );

const createExitedTileStream = (enteredTile) =>
  F.transduce(R.dropLast(1), enteredTile);

export const createStreams = ({container, getTileUnderMouse}) => {
  const mouseMove = F.stream();
  const mouseOver = F.stream();
  const windowResize = F.stream();
  const animationFrame = F.stream();
  const mouseOut = F.transduce(R.reject(R.identity), mouseOver);
  const containerMeasurements = createContainerMeasurementsStream(container, windowResize);
  const mousePosition = createMousePositionStream(mouseMove, mouseOver, containerMeasurements);
  const cameraToPosition = createCameraToPositionStream(mousePosition);
  const lightToPosition = createLightToPositionStream(mousePosition);
  const cameraPosition = createSteppedPositionStream(animationFrame, cameraToPosition, 0.5);
  const lightPosition = createSteppedPositionStream(animationFrame, lightToPosition, 0.5);
  const enteredTile = createEnteredTileStream(getTileUnderMouse, mouseOut, mousePosition);
  const exitedTile = createExitedTileStream(enteredTile);

  windowResize(null);
  cameraToPosition({x: 0, y: -5});
  lightToPosition({x: 0, y: 0});
  lightPosition({x: 0, y: 0});
  cameraPosition({x: 0, y: -5});

  return {
    mouseMove,
    mouseOver,
    windowResize,
    animationFrame,
    mouseOut,
    containerMeasurements,
    mousePosition,
    cameraToPosition,
    lightToPosition,
    cameraPosition,
    lightPosition,
    enteredTile,
    exitedTile
  };
};

export const endStreams = ({streams}) => {
  R.forEach((stream) => stream.end(true), streams);
};

export const addListeners = ((container, {windowResize, mouseMove, mouseOver}) => {
  const listeners = [
    [window, 'resize', windowResize],
    [window, 'mousemove', mouseMove],
    [container, 'mouseout', () => mouseOver(false)],
    [container, 'mouseover', () => mouseOver(true)]
  ];

  R.forEach(
    ([el, event, listener]) => el.addEventListener(event, listener, false),
    listeners
  );

  return listeners;
});

export const removeListeners = (listeners) =>
  R.forEach(
    ([el, event, listener]) => el.removeEventListener(event, listener),
    listeners
  );

export const startClock = ({animationFrame}) => {
  const tick = (t) => {
    animationFrame(t);
    animationFrame.end() || requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
