export function boundsSize(bounds) {
  const [
    x,
    y,
    width,
    height
  ] = bounds;
  return width * height;
};

export function compareBoundsSize(rectA, rectB) {
  return boundsSize(rectA) > boundsSize(rectB);
};

export function isInRect(x, y, bounds) {
  const [
    _x,
    _y,
    width,
    height
  ] = bounds;

  return x >= _x
    && x <= _x + width
    && y >= _y
    && y <= _y + height;
};

export function getNodePathByXY(tree, x, y) {
  let bestBounds = null;
  let bestPath = null;

  function walk(node, path) {
    if (node && node.bounds){
      let bounds = node.bounds;
      let inRect = isInRect(x, y, bounds);

      if (inRect) {
        if (!bestBounds || compareBoundsSize(bestBounds, bounds)) {
          bestBounds = bounds;
          bestPath = path;
        }

        if (node.nodes) {
          node.nodes.forEach((child, index) => {
            walk(child, path.concat([index]));
          });
        }
      }
    }

  }

  tree && tree.forEach((node,index) => walk(node, [index]))

  // walk(tree, []);

  return bestPath;
};
