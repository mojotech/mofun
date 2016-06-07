import R from 'ramda';
import F from 'flyd';

import {createSteppedPositionStream} from './util/stream';

const createContainerRectStream = (container, windowResize, windowScroll) =>
  F.merge(windowResize, windowScroll).map(() => container.getBoundingClientRect());

const createMousePositionStream = (mouseOut, mouseMove, containerRect) =>
  F.merge(
    mouseOut.map(() => null),
    F.combine((mouse, container, self) => {
      const m = mouse();
      const c = container();

      if(m.clientX > c.left &&
         m.clientX < c.right &&
         m.clientY > c.top &&
         m.clientY < c.bottom) {
           self({
             x: ((m.clientX - c.left) / c.width) * 2 - 1,
             y: - ((m.clientY - c.top) / c.height) * 2 + 1
           });
      } else {
        self(null);
      }
    }, [mouseMove, containerRect]));

const createCameraToPositionStream = (mousePosition) =>
  F.combine((m, self) => {
    m() && self({
      x: m().x,
      y: m().y -5
    });
  }, [mousePosition]);

const createLightToPositionStream = (mousePosition) =>
  F.combine((m, self) => {
    m() && self({
      x: 5 * -m().x,
      y: 5 * -m().y
    });
  }, [mousePosition]);

const createEnteredTileStream = (getTileUnderMouse, mousePosition) =>
  F.transduce(
    R.compose(R.map(getTileUnderMouse), R.dropRepeats),
    mousePosition
  );

const createExitedTileStream = (enteredTile) =>
  F.transduce(R.dropLast(1), enteredTile);

export const createStreams = ({container, getTileUnderMouse}) => {
  const mouseOut = F.stream();
  const mouseMove = F.stream();
  const windowResize = F.stream();
  const windowScroll = F.stream();
  const animationFrame = F.stream();
  const containerRect = createContainerRectStream(container, windowResize, windowScroll);
  const mousePosition = createMousePositionStream(mouseOut, mouseMove, containerRect);
  const cameraToPosition = createCameraToPositionStream(mousePosition);
  const lightToPosition = createLightToPositionStream(mousePosition);
  const cameraPosition = createSteppedPositionStream(animationFrame, cameraToPosition, 0.5);
  const lightPosition = createSteppedPositionStream(animationFrame, lightToPosition, 0.5);
  const enteredTile = createEnteredTileStream(getTileUnderMouse, mousePosition);
  const exitedTile = createExitedTileStream(enteredTile);

  windowResize(null);
  cameraToPosition({x: 0, y: -5});
  lightToPosition({x: 0, y: 0});
  lightPosition({x: 0, y: 0});
  cameraPosition({x: 0, y: -5});

  return {
    mouseOut,
    mouseMove,
    windowResize,
    windowScroll,
    animationFrame,
    containerRect,
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

export const addListeners = ((container, {windowResize, windowScroll, mouseOut, mouseMove}) => {
  const listeners = [
    [window, 'mouseout', mouseOut],
    [window, 'mousemove', mouseMove],
    [window, 'resize', windowResize],
    [window, 'scroll', windowScroll]
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
