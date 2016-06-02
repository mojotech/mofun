import R from 'ramda';
import F from 'flyd';

import {
  getTileUnderMouse,
  exitTile,
  enterTile,
  resizeRenderer,
  positionLight,
  positionCamera,
  renderAnimationFrame
} from './honeycomb';

const steppedPositionStream = (clock, toPosition, step) =>
  F.combine(
    (t, to, self) => {
      const o = to();
      const {x, y} = self();

      if(x !== o.x || y !== o.y) {
        self({
          x: stepToward(x, o.x, step),
          y: stepToward(y, o.y, step)
        });
      }
    },
    [clock, toPosition]
  );

const stepToward = (pos, to, step) => {
  if(pos > to) {
    return step >= pos - to ? to : pos - step;
  } else {
    return step >= to - pos ? to : pos + step;
  }
};

export const generateStreams = ({honeycomb, container}) => {
  const mouseMove = F.stream();
  const mouseOver = F.stream();
  const windowResize = F.stream();
  const animationFrame = F.stream();

  const mouseOut = F.transduce(R.reject(R.identity), mouseOver);

  const containerMeasurements = windowResize.map(() => ({
    w: container.clientWidth,
    h: container.clientHeight,
    x: container.offsetLeft,
    y: container.offsetTop
  }));
  windowResize(null);

  const mousePosition = F.combine((over, mouse, container, self) => {
    const m = mouse();
    const c = container();

    if(over()) {
      self({
        x: ((m.clientX - c.x) / c.w) * 2 - 1,
        y: - ((m.clientY - c.y) / c.h) * 2 + 1
      });
    }
  }, [mouseOver, mouseMove, containerMeasurements]);

  const cameraToPosition = mousePosition.map((m) => ({
    x: m.x,
    y: m.y - 5
  }));
  cameraToPosition({x: 0, y: -5});

  const lightToPosition = mousePosition.map((m) => ({
    x: 5 * -m.x,
    y: 5 * -m.y
  }));
  lightToPosition({x: 0, y: 0});

  const enteredTile =  F.transduce(
    R.compose(R.map(R.partial(getTileUnderMouse, [honeycomb])), R.dropRepeats),
    F.merge(mouseOut, mousePosition)
  );

  const exitedTile = F.transduce(R.dropLast(1), enteredTile);

  const lightPosition = steppedPositionStream(animationFrame, lightToPosition, 0.5);
  lightPosition({x: 0, y: 0});

  const cameraPosition = steppedPositionStream(animationFrame, cameraToPosition, 0.5);
  cameraPosition({x: 0, y: -5});

  const onMouseOver = () => mouseOver(true);
  const onMouseOut = () => mouseOver(false);

  window.addEventListener('resize', windowResize, false);
  window.addEventListener('mousemove', mouseMove, false);
  container.addEventListener('mouseout', onMouseOut, false);
  container.addEventListener('mouseover', onMouseOver, false);

  const startTicking = () => {
    var stop = false;

    const tick = (t) => {
      animationFrame(t);
      stop || requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    return () => stop = true;
  };

  const stopTicking = startTicking();

  F.on(R.partial(exitTile, [honeycomb]), exitedTile);
  F.on(R.partial(enterTile, [honeycomb]), enteredTile);
  F.on(R.partial(positionLight, [honeycomb]), lightPosition);
  F.on(R.partial(positionCamera, [honeycomb]), cameraPosition);
  F.on(R.partial(resizeRenderer, [honeycomb]), containerMeasurements);
  F.on(R.partial(renderAnimationFrame, [honeycomb]), animationFrame);

  return {
    exitedTile,
    enteredTile,
    lightPosition,
    cameraPosition,
    animationFrame,
    containerMeasurements,
    stopTicking,
    windowResize,
    mouseMove,
    onMouseOver,
    onMouseOut
  };
};

const disposeStreams = ({container, stopTicking, windowResize, mouseMove, onMouseOver, onMouseOut}) => {
  stopTicking();
  window.removeEventListener('resize', windowResize);
  window.removeEventListener('mousemove', mouseMove);
  container.removeEventListener('mouseout', onMouseOut);
  container.removeEventListener('mouseover', onMouseOver);
};
