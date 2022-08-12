const lerpVal = (fromVal, toVal, t) => {
  return (toVal - fromVal) * t + fromVal;
};

const lerpCol = (fromCol, toCol, t) => {
  return {
    r: lerpVal(fromCol.r, toCol.r, t),
    g: lerpVal(fromCol.g, toCol.g, t),
    b: lerpVal(fromCol.b, toCol.b, t),
    a: lerpVal(fromCol.a, toCol.a, t),
  };
};

const tryParseRGBA = (data, c) => {
  m = data
    .toLowerCase()
    .match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([0-9.]*)\s*\)/);
  if (m) {
    (c.r = parseInt(m[1])),
      (c.g = parseInt(m[2])),
      (c.b = parseInt(m[3])),
      (c.a = parseFloat(m[4]));
    if (isNaN(c.a)) c.a = 1.0;
    return true;
  }
};

const tryParseHEX = (data, c) => {
  m = data
    .toLowerCase()
    .match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{0,2})/);
  if (m) {
    //console.log(m);
    const [r, g, b, a] = m.slice(1, 5).map((s) => parseInt(s, 16));
    c.r = r;
    c.g = g;
    c.b = b;
    c.a = (isNaN(a) ? 255 : a) / 255;
    return true;
  }
  m = data
    .toLowerCase()
    .match(/#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F]?)/);
  if (m) {
    //console.log(m);
    const [r, g, b, a] = m.slice(1, 5).map((s) => parseInt(s, 16));
    c.r = r * 17;
    c.g = g * 17;
    c.b = b * 17;
    c.a = (isNaN(a) ? 15 : a) / 15;
    return true;
  }
};

const parseColor = (data) => {
  let c = { r: 0, g: 0, b: 0, a: 0 };
  for (fn of [tryParseRGBA, tryParseHEX]) {
    if (fn(data, c)) break;
  }
  return {
    src: data,
    ...c,
  };
};

const toColorString = (data) => {
  //console.log(data);
  let rv = Math.max(Math.min(255, Math.floor(data.r)), 0);
  let gv = Math.max(Math.min(255, Math.floor(data.g)), 0);
  let bv = Math.max(Math.min(255, Math.floor(data.b)), 0);
  let av = Math.max(Math.min(1, data.a), 0);
  //console.log(`rgb${(av<1.0)?'a':''}(${rv}, ${gv}, ${bv}${(av<1.0)?`, ${av}`:''})`);
  return `rgb${av < 1.0 ? 'a' : ''}(${rv}, ${gv}, ${bv}${
    av < 1.0 ? `, ${av}` : ''
  })`;
};

const makeLineElement = (x1, y1, x2, y2, makeElement) => {
  const newElement = makeElement('line');
  newElement.setAttribute('x1', x1);
  newElement.setAttribute('y1', y1);
  newElement.setAttribute('x2', x2);
  newElement.setAttribute('y2', y2);
  newElement.setAttribute('stroke', 'rgba(0,255,0,0.5)');
  return newElement;
};

const makeBgGroup = (svgRoot, makeElement) => {
  const newElement = makeElement('g');
  svgRoot.insertBefore(newElement, svgRoot.firstChild);
  return newElement;
};

const makeFgGroup = (svgRoot, makeElement) => {
  const newElement = makeElement('g');
  svgRoot.appendChild(newElement);
  return newElement;
};

const prepareBeams = (geometries, makeElement) => {
  const svgRoot = geometries[0].element.closest('svg');
  const { x, y, width, height } = svgRoot.viewBox.baseVal;
  const sx = x + width / 2;
  const sy = y + height / 3;
  const beams = [];
  dp = new DOMPoint(2, 0);
  //console.log(dp.x,dp.y);
  dp = dp.matrixTransform(svgRoot.getCTM().inverse());
  //console.log(dp.x,dp.y);
  const baseColor = parseColor('#14fdce');
  //baseColor.a=0.01;
  for (let geom of geometries) {
    const { x, y } = geom.element.getPointAtLength(0);
    const line = makeLineElement(sx, sy, x, y, makeElement);
    line.style.strokeWidth = dp.x;
    let lcol = lerpCol(geom.animStyle.fillTo, baseColor, 0.2);
    lcol.a = 0.3;
    line.style.stroke = toColorString(lcol);
    beams.push({
      geometry: geom,
      line: line,
    });
  }
  return beams; //.slice(3,5);
};

const getAllGeometryElements = (svgRoot) => {
  const all = svgRoot.querySelectorAll('*');
  const geometry = [];
  for (let i = 0; i < all.length; i++) {
    const element = all[i];
    if (element instanceof SVGGeometryElement) {
      geometry.push(element);
    }
  }
  return geometry;
};

const prepareGeometry = (svgRoot) => {
  const geometries = [];
  for (let geometry of getAllGeometryElements(svgRoot)) {
    const style = geometry.style;
    let ofc = parseColor(getComputedStyle(geometry).fill);
    let fc = parseColor(getComputedStyle(geometry).fill);
    //console.log(fc);
    if (fc.r == 255 && fc.g == 255 && fc.b == 255) fc = parseColor('#14fdce');
    style.fill = toColorString(fc);
    const tg = {
      element: geometry,
      length: geometry.getTotalLength(),
      actualStyle: {
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        fill: style.fill,
        strokeDasharray: style.strokeDasharray,
        strokeDashoffset: style.strokeDashoffset, //,
        //vectorEffect:geometry.getAttribute("vector-effect")
      },
      animStyle: {},
    };

    const ds = style.stroke;
    const dsw = style.strokeWidth;
    const df = style.fill;
    dp = new DOMPoint(2.5, 0);
    //console.log(dp.x,dp.y);
    dp = dp.matrixTransform(geometry.getCTM().inverse());
    //console.log(dp.x,dp.y);
    if (ds == '' || ds == 'none') {
      style.stroke = toColorString(ofc);
      style.strokeWidth = dp.x;
      let fc = parseColor(getComputedStyle(geometry).fill);
      tg.animStyle.fillTo = { ...fc };
      fc.a = 0;
      style.fill = toColorString(fc);
      tg.animStyle.fillFrom = fc;
    } else {
      console.log('nope');
    }
    //geometry.setAttribute("vector-effect","non-scaling-stroke");
    style.strokeDasharray = geometry.getTotalLength();
    style.strokeDashoffset = geometry.getTotalLength();
    geometries.push(tg);
  }
  return geometries;
};

const restoreStyles = (geom) => {
  for (let geometry of geom) {
    const s = geometry.element.style;
    const as = geometry.actualStyle;
    s.stroke = as.stroke;
    s.strokeWidth = as.strokeWidth;
    s.fill = as.fill;
    s.strokeDasharray = as.strokeDasharray;
    s.strokeDashoffset = as.strokeDashoffset;
    // if (as.vectorEffect===null) {
    //     geometry.element.removeAttribute("vector-effect");
    // } else {
    //     geometry.element.setAttribute("vector-effect",as.vectorEffect);
    // }
  }
};

const moveBeams = (beams, svgRoot, progress) => {
  const { x, y, width, height } = svgRoot.viewBox.baseVal;
  //let cx=lerpVal(x+(width/2)-(width/4),x+(width/2)+(width/4),progress);
  //let cy=lerpVal(y,y+height,progress);
  //cx=0;
  //cy=0;
  for (let { geometry, line } of beams) {
    let pt = geometry.element.getPointAtLength(progress * geometry.length);
    pt = pt
      .matrixTransform(geometry.element.getCTM())
      .matrixTransform(svgRoot.getCTM().inverse());
    //line.setAttribute("x1",cx);
    //line.setAttribute("y1",cy)
    line.setAttribute('x2', pt.x);
    line.setAttribute('y2', pt.y);
  }
};

const removeBeams = (beams) => {
  for (let beam of beams) {
    beam.line.parentElement.removeChild(beam.line);
  }
};

const drawStrokes = (beams, progress) => {
  for (let { element, length } of beams) {
    const style = element.style;
    style.strokeDashoffset = (1 - progress) * length;
  }
};

const makeSvgPlotter = (svgRoot, duration) => {
  const _svgRoot = svgRoot;
  const _duration = duration;
  const dm = svgRoot.style.display;
  svgRoot.style.display = 'none';
  return async (plotter) => {
    const makeElement = (name) => {
      return svgRoot.ownerDocument.createElementNS(
        'http://www.w3.org/2000/svg',
        name
      );
    };
    const geom = prepareGeometry(_svgRoot);
    const beams = prepareBeams(geom, makeElement);
    let bgg = makeBgGroup(_svgRoot, makeElement);
    let fgg = makeFgGroup(_svgRoot, makeElement);
    let newElement = makeElement('rect');
    window.ne = newElement;
    const { x, y, width, height } = _svgRoot.viewBox.baseVal;
    newElement.setAttribute('fill', 'black');
    newElement.setAttribute('width', width);
    newElement.setAttribute('height', height);
    //bgg.appendChild(newElement);
    for (let beam of beams) {
      bgg.appendChild(beam.line);
    }
    svgRoot.style.display = dm;
    plotter.positionCarret(svgRoot);
    await animUtils.animateFunction((elapsed, proceed, finish) => {
      moveBeams(beams, _svgRoot, elapsed);
      drawStrokes(geom, elapsed);
      if (elapsed >= 1) finish();
    }, _duration * 0.75);
    removeBeams(beams);
    await animUtils.animateFunction((elapsed, proceed, finish) => {
      for (let geometry of geom) {
        let as = geometry.animStyle;
        geometry.element.style.fill = toColorString(
          lerpCol(as.fillFrom, as.fillTo, elapsed)
        );
      }
      if (elapsed >= 1) finish();
    }, _duration * 0.25);

    restoreStyles(geom);
    //console.log("Plogo2");
  };
};
