import R from 'ramda';
import F from 'flyd';

import {
  createStreams,
  endStreams,
  startClock,
  addListeners,
  removeListeners
} from './interaction';

import {
  generateAnimation,
  disposeAnimation,
  getTileUnderMouse,
  exitTile,
  enterTile,
  positionLight,
  positionCamera,
  resizeRenderer,
  renderAnimationFrame
} from './animation';

export const createHoneycomb = (container) => {
  const animation = generateAnimation({container});
  const streams = createStreams({
    container,
    getTileUnderMouse: R.partial(getTileUnderMouse, [animation])
  });
  const listeners = addListeners(container, streams);

  startClock(streams);

  F.on(R.partial(exitTile, [animation]), streams.exitedTile);
  F.on(R.partial(enterTile, [animation]), streams.enteredTile);
  F.on(R.partial(positionLight, [animation]), streams.lightPosition);
  F.on(R.partial(positionCamera, [animation]), streams.cameraPosition);
  F.on(R.partial(resizeRenderer, [animation]), streams.containerRect);
  F.on(R.partial(renderAnimationFrame, [animation]), streams.animationFrame);

  return {listeners, animation, streams};
};

export const destroyHoneycomb = ({animation, streams, listeners}) => {
  removeListeners(listeners);
  endStreams(streams);
  disposeAnimation(animation);
};
