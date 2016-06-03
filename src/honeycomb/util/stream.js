import F from 'flyd';

const stepToward = (pos, to, step) => {
  if(pos > to) {
    return step >= pos - to ? to : pos - step;
  } else {
    return step >= to - pos ? to : pos + step;
  }
};

export const createSteppedPositionStream = (clock, toPosition, step) =>
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
