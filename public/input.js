var ua = window.navigator.userAgent;
var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
var webkit = !!ua.match(/WebKit/i);
var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

const pointInRect = (point, rect) => {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
};

// if (detail.buttonId==0) press("a");
// if (detail.buttonId==1) press("b");
// if (detail.buttonId==12) press("up");
// if (detail.buttonId==13) press("down");
// if (detail.buttonId==14) press("left");
// if (detail.buttonId==15) press("right");
//ldur
//hjkl
//5678

const buttons = {
  A: { id: 0, keyCodes: ['KeyA', 'KeyZ', 'Space'] },
  B: { id: 1, keyCodes: ['KeyB', 'KeyX', 'ControlLeft'] },
  Up: { id: 12, keyCodes: ['ArrowUp', 'KeyK', 'Digit7', 'Numpad8'] },
  Down: { id: 13, keyCodes: ['ArrowDown', 'KeyJ', 'Digit6', 'Numpad2'] },
  Left: { id: 14, keyCodes: ['ArrowLeft', 'KeyH', 'Digit5', 'Numpad4'] },
  Right: { id: 15, keyCodes: ['ArrowRight', 'KeyL', 'Digit8', 'Numpad6'] },
};

const codeMap = Object.keys(buttons).reduce((obj, button) => {
  const data = buttons[button];
  data.keyCodes.forEach((code) => {
    obj[code] = { id: data.id, name: button };
  });
  return obj;
}, {});

const controllers = {};
const controllerState = {};

const gamepadConnectHandler = (e) => {
  controllers[e.gamepad.index] = e.gamepad;
  requestAnimationFrame(updateGamepads);
};
const gamepadDisconnectHandler = (e) => {
  delete controllers[e.gamepad.index];
};

const getButtonState = (ci, bi) => {
  if (!controllerState[ci]) controllerState[ci] = {};
  const stateRoot = controllerState[ci];
  if (!stateRoot['buttons']) stateRoot['buttons'] = {};
  const buttonRoot = stateRoot.buttons;
  if (!buttonRoot[bi])
    buttonRoot[bi] = { pressed: false, touched: false, value: 0 };
  return { ...buttonRoot[bi] };
};

const setButtonState = (ci, bi, bs) => {
  const lastState = getButtonState(ci, bi);
  const stateRoot = controllerState[ci];
  const buttonRoot = stateRoot.buttons;
  buttonRoot[bi] = {
    pressed: bs.pressed,
    touched: bs.touched,
    value: bs.value,
  };
  const currentState = buttonRoot[bi];

  if (currentState.touched != lastState.touched) {
    if (currentState.touched) {
      buttonTouchStart({
        inputId: ci,
        buttonId: bi,
        gamepadButtonData: currentState,
      });
    } else {
      buttonTouchEnd({
        inputId: ci,
        buttonId: bi,
        gamepadButtonData: currentState,
      });
    }
  }
  if (currentState.pressed != lastState.pressed) {
    if (currentState.pressed) {
      buttonDown({
        inputId: ci,
        buttonId: bi,
        gamepadButtonData: currentState,
      });
    } else {
      buttonUp({ inputId: ci, buttonId: bi, gamepadButtonData: currentState });
    }
  }

  if (currentState.value != lastState.value) {
    buttonValueChange({
      inputId: ci,
      buttonId: bi,
      value: currentState.value,
      gamepadButtonData: currentState,
    });
  }
};

const press = (buttonName, inputName = 'unified') => {
  setButtonState(inputName, buttonName, {
    pressed: true,
    touched: false,
    value: 0,
  });
};

const release = (buttonName, inputName = 'unified') => {
  setButtonState(inputName, buttonName, {
    pressed: false,
    touched: false,
    value: 0,
  });
};

const buttonDown = (detail) => {
  if (detail.inputId == 'unified') {
    //console.log("bpstart",detail);
    return;
  }
  if (detail.inputId == 'initialOverlay') {
    //console.log("IO",release);
    return;
  }
  if (detail.buttonId == 0) press('a');
  if (detail.buttonId == 1) press('b');
  if (detail.buttonId == 12) press('up');
  if (detail.buttonId == 13) press('down');
  if (detail.buttonId == 14) press('left');
  if (detail.buttonId == 15) press('right');
};

const kCode = [
  [{ i: '*', b: 'up' }],
  [{ i: '*', b: 'up' }],
  [{ i: '*', b: 'down' }],
  [{ i: '*', b: 'down' }],
  [{ i: '*', b: 'left' }],
  [{ i: '*', b: 'right' }],
  [{ i: '*', b: 'left' }],
  [{ i: '*', b: 'right' }],
  [
    { i: '*', b: 'b' },
    { i: 'initialOverlay', b: 'right' },
  ],
  [
    { i: '*', b: 'a' },
    { i: 'initialOverlay', b: 'left' },
  ],
];

let kCodeIndex = 0;

const testKEntry = (inputId, buttonId) => {
  const kodeEntry = kCode[kCodeIndex];
  for (ktest of kodeEntry) {
    if (ktest.b == buttonId) {
      if (ktest.i == '*' || ktest.i == inputId) return true;
    }
  }
  return false;
};

const parseKCode = (inputId, buttonId) => {
  if (testKEntry(inputId, buttonId)) {
    kCodeIndex++;
  } else {
    kCodeIndex = 0;
    if (testKEntry(inputId, buttonId)) kCodeIndex++;
  }
  if (kCodeIndex == kCode.length) {
    kCodeIndex = 0;
    //console.log("UNLOCKED");
    if (unlocked) return;
    unlocked = true;
    //console.log("unlocked");
    addOSC();
    game.debug = false;
    game.initialise();
  }
};

let unlocked = false;

const buttonUp = (detail) => {
  if (detail.inputId == 'unified') {
    //console.log("bpend",detail);
    parseKCode(detail.inputId, detail.buttonId);
    return;
  }
  if (detail.inputId == 'initialOverlay') {
    //console.log("IO",release);
    parseKCode(detail.inputId, detail.buttonId);
    return;
  }
  if (detail.buttonId == 0) release('a');
  if (detail.buttonId == 1) release('b');
  if (detail.buttonId == 12) release('up');
  if (detail.buttonId == 13) release('down');
  if (detail.buttonId == 14) release('left');
  if (detail.buttonId == 15) release('right');
};

const buttonTouchStart = (detail) => {
  if (detail.inputId == 'unified') {
    console.log('btstart', detail);
    return;
  }
};

const buttonTouchEnd = (detail) => {
  if (detail.inputId == 'unified') {
    console.log('btend', detail);
    return;
  }
};

const buttonValueChange = (detail) => {
  if (detail.inputId == 'unified') {
    //console.log("bvc",detail);
    return;
  }
};

const setAxisState = (ci, ai, as) => {
  if (!controllerState[ci]) controllerState[ci] = {};
  const stateRoot = controllerState[ci];
  if (!stateRoot['axes']) stateRoot['axes'] = {};
  const axesRoot = stateRoot.axes;
  if (!axesRoot[ai]) axesRoot[ai] = 0;
  const lastState = axesRoot[ai];
  axesRoot[ai] = as;
  if (lastState != as) {
    const delta = as - lastState;
    axisValueChanged({
      inputId: ci,
      axisId: ai,
      value: as,
      previousValue: lastState,
      delta: delta,
    });
  }
};

const axisValueChanged = (detail) => {
  if (detail.inputId == 1) return;
  //console.log("avc",detail);
  if (detail.axisId == 0) {
    if (detail.value <= -0.66) {
      press('left');
    } else release('left');
    if (detail.value >= 0.66) {
      press('right');
    } else release('right');
  }
  if (detail.axisId == 1) {
    if (detail.value <= -0.66) {
      press('up');
    } else release('up');
    if (detail.value >= 0.66) {
      press('down');
    } else release('down');
  }
};

const updateGamepads = () => {
  scanGamepads();
  for (j in controllers) {
    var controller = controllers[j];
    for (var i = 0; i < controller.buttons.length; i++) {
      //var bval = controller.buttons[i];
      //if (bval.touched) console.log(j,i,bval);
      setButtonState(j, i, controller.buttons[i]);
    }
    for (var i = 0; i < controller.axes.length; i++) {
      //console.log(controller.axes[i]);
      //var bval = controller.buttons[i];
      //if (bval.touched) console.log(j,i,bval);
      setAxisState(j, i, controller.axes[i]);
    }
  }
  requestAnimationFrame(updateGamepads);
};

const scanGamepads = () => {
  var gamepads = navigator.getGamepads
    ? navigator.getGamepads()
    : navigator.webkitGetGamepads
    ? navigator.webkitGetGamepads()
    : [];
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && gamepads[i].index in controllers) {
      controllers[gamepads[i].index] = gamepads[i];
    }
  }
};

const setupGamepads = () => {
  window.addEventListener('gamepadconnected', gamepadConnectHandler);
  window.addEventListener('gamepaddisconnected', gamepadDisconnectHandler);
};

const createControl = (text, className, parent) => {
  let newControl = document.createElement('div');
  newControl.classList.add('osc-control');
  newControl.classList.add(className);
  let newSpan = document.createElement('span');
  newSpan.textContent = text;
  parent.appendChild(newControl);
  newControl.appendChild(newSpan);
  return newControl;
};

const addEvents = (element, bname) => {
  element.addEventListener('pointerdown', (ev) => {
    press(bname);
  });
  element.addEventListener('pointerup', (ev) => {
    release(bname);
  });
  element.addEventListener('pointerout', (ev) => {
    release(bname);
  });

  element.addEventListener('selectstart', (ev) => {
    return false;
  });
};

const addOSC = () => {
  let overlayBase = document.querySelector('div.control-overlay');

  let controls = document.createElement('div');
  controls.classList.add('osc-layout');
  overlayBase.appendChild(controls);

  const left = createControl('L', 'osc-left', controls);
  addEvents(left, 'left');
  const right = createControl('R', 'osc-right', controls);
  addEvents(right, 'right');
  const abut = createControl('A', 'osc-a', controls);
  addEvents(abut, 'a');
  const bbut = createControl('B', 'osc-b', controls);
  addEvents(bbut, 'b');
};

let actors = [];
let hero, playfield, backplane;

const fragmentString = (ptext) => {
  const text = ptext.replaceAll('\xa0', ' ');
  let midPoint = Math.floor(text.length / 2);
  let amidpoint = text.lastIndexOf(' ', midPoint);
  if (amidpoint != -1) {
    midPoint = amidpoint;
  } else {
    amidpoint = text.indexOf(' ', midPoint);
    if (amidpoint != -1) midPoint = amidpoint;
  }
  return [text.substring(0, midPoint).trim(), text.substring(midPoint).trim()];
};

// const initGameLoop=()=>{

//     gdb=document.getElementById("gdbg")
//     backplane = document.querySelector("div.output");
//     backplane.addEventListener("scroll",(e)=>{
//         //if (hitboxes.length>0) rebuildHitBoxes();
//     })
//     //rebuildHitBoxes();
//     // window.addEventListener("mouseup",(e)=>{
//     //     let x=e.clientX;
//     //     let y=e.clientY;
//     //     //console.log(e.clientX,e.clientY);
//     //     let r=backplane.getBoundingClientRect();
//     //     //console.log(r);
//     //     //x-=r.left;
//     //     //y-=r.top;
//     //     let hit=checkCollisionsAt(x,y);
//     //     if (hit) {
//     //         console.log(hit);
//     //         explnode(hit.node,hit.bounds);
//     //     }
//     // })
//     playfield=document.getElementById("playfield")
//     hero = {
//         type:"hero",
//         element:document.getElementsByClassName("ship")[0],
//         thrustElement:document.getElementById("ship-thrust"),
//         angle:0,
//         x:0,
//         y:0,
//         w:20,
//         h:32,
//         xspeed:0,
//         yspeed:0,
//         size:32
//     }
//     //console.log(hero);
//     actors.push(hero);
//     //requestAnimationFrame(gameFrame);
// }

let lastTime;

// let gdb

const setupInputs = () => {
  game.debug = false;
  if (game.debug) {
    addOSC();
    game.initialise();
  }
  const ue = document.querySelector('div.up');
  const de = document.querySelector('div.down');
  const le = document.querySelector('div.left');
  const re = document.querySelector('div.right');
  const fe = document.querySelector('div.frame');

  // fe.addEventListener("mousedown",(ev)=>{
  //     let urect=ue.getBoundingClientRect();
  //     let drect=de.getBoundingClientRect();
  //     let lrect=le.getBoundingClientRect();
  //     let rrect=re.getBoundingClientRect();
  //     console.log(ev);
  //     //console.log(rrect,rrect);
  //     if (pointInRect({x:ev.clientX,y:ev.clientY},urect)) press(12,"overlay");
  //     if (pointInRect({x:ev.clientX,y:ev.clientY},drect)) press(13,"overlay");
  //     if (pointInRect({x:ev.clientX,y:ev.clientY},lrect)) press(14,"overlay");
  //     if (pointInRect({x:ev.clientX,y:ev.clientY},rrect)) press(15,"overlay");
  // })

  fe.addEventListener('pointerdown', (ev) => {
    let urect = ue.getBoundingClientRect();
    let drect = de.getBoundingClientRect();
    let lrect = le.getBoundingClientRect();
    let rrect = re.getBoundingClientRect();
    //console.log(ev);
    //console.log(rrect,rrect);
    if (pointInRect({ x: ev.clientX, y: ev.clientY }, urect))
      press('up', 'initialOverlay');
    if (pointInRect({ x: ev.clientX, y: ev.clientY }, drect))
      press('down', 'initialOverlay');
    if (pointInRect({ x: ev.clientX, y: ev.clientY }, lrect))
      press('left', 'initialOverlay');
    if (pointInRect({ x: ev.clientX, y: ev.clientY }, rrect))
      press('right', 'initialOverlay');
  });

  fe.addEventListener('pointerup', (ev) => {
    let urect = ue.getBoundingClientRect();
    let drect = de.getBoundingClientRect();
    let lrect = le.getBoundingClientRect();
    let rrect = re.getBoundingClientRect();
    //console.log(re);
    //console.log(rrect,rrect);

    release('up', 'initialOverlay');
    release('down', 'initialOverlay');
    release('left', 'initialOverlay');
    release('right', 'initialOverlay');
  });

  document.addEventListener('keydown', (evt) => {
    const mapping = codeMap[evt.code];
    if (mapping) press(mapping.id, 'keyboard');
  });

  document.addEventListener('keyup', (evt) => {
    const mapping = codeMap[evt.code];
    if (mapping) release(mapping.id, 'keyboard');
  });

  setupGamepads();
};

var util = new (function () {
  const setAttributes = (element, attributes) => {
    for (const [key, val] of Object.entries(attributes)) {
      element.setAttribute(key, val);
    }
  };
  this.setAttributes = setAttributes;

  const getAttributes = (element) => {
    const attributes = {};
    for (let name of element.getAttributeNames()) {
      attributes[name] = element.getAttribute(name);
    }
    return attributes;
  };
  this.getAttributes = getAttributes;

  const createNsElement = (namespaceURI, qualifiedName, attributes = {}) => {
    const newElement = document.createElementNS(namespaceURI, qualifiedName);
    setAttributes(newElement, attributes);
    return newElement;
  };

  this.createElement = (tagname, attributes = {}) => {
    const newElement = document.createElement(tagname);
    setAttributes(newElement, attributes);
    return newElement;
  };

  this.createSvgElement = (tagName, attributes = {}) => {
    return createNsElement('http://www.w3.org/2000/svg', tagName, attributes);
  };

  const cloneBranch = (leaf, root) => {
    const attributes = getAttributes(leaf);
    delete attributes['id'];
    //console.log(attributes);
    const newElement = createNsElement(
      leaf.namespaceURI,
      leaf.tagName,
      attributes
    );
    if (leaf !== root && leaf.parentElement) {
      cloneBranch(leaf.parentElement, root).appendChild(newElement);
    }
    return newElement;
  };
  this.cloneBranch = cloneBranch;
})();

var game = new (function () {
  let backplane, playfield, hero, pfb;

  let cooldown = 0;
  this.debug = false;

  const actors = [];
  const bgHitboxes = [];

  const range = document.createRange();

  const addActor = (actorData) => {
    actorData.element.style.position = 'absolute';
    actors.push(actorData);
    return actorData;
  };

  const moveActor = (actor, deltaTime) => {
    const dx = actor.xspeed * deltaTime;
    const dy = actor.yspeed * deltaTime;

    actor.x += dx;
    actor.y += dy;
    if (actor.maxDistance) {
      let dd = Math.sqrt(dx * dx + dy * dy);
      actor.distance += dd;
      //console.log(actor.x);
    }
    let aw = actor.w;
    let ah = actor.h;
    if (actor.size) {
      aw = actor.size;
      ah = actor.size;
    }
    if (actor.x < -aw) actor.x += pfb.width + aw;
    if (actor.x > pfb.width + aw) actor.x -= pfb.width + aw * 2;
    if (actor.y < -ah) actor.y += pfb.height + ah;
    if (actor.y > pfb.height + ah) actor.y -= pfb.height + ah * 2;
    actor.element.style.top = `${actor.y}px`;
    actor.element.style.left = `${actor.x}px`;
  };

  const removeActor = (actor) => {
    const element = actor.element;
    if (element.parentElement) element.parentElement.removeChild(element);
    let index = actors.indexOf(actor);
    if (index == -1) return;
    actors.splice(index, 1);
  };

  const removeActors = (actorsToRemove) => {
    if (actorsToRemove.length == 0) return;
    for (let actorToRemove of actorsToRemove) {
      removeActor(actorToRemove);
    }
  };

  const moveActors = (deltaTime) => {
    let ra = [];
    for (let actor of actors) {
      moveActor(actor, deltaTime);
      if (actor.maxDistance && actor.distance > actor.maxDistance) {
        ra.push(actor);
      }
    }
    removeActors(ra);
  };

  const addImpulse = (actor, deltaTime, maxSpeed) => {
    let rad = (hero.angle * Math.PI) / 180;
    const ax = Math.sin(rad) * (deltaTime * 0.0005);
    const ay = -Math.cos(rad) * (deltaTime * 0.0005);
    let vx = actor.xspeed + ax;
    let vy = actor.yspeed + ay;
    let speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > maxSpeed) {
      vx = (vx / speed) * maxSpeed;
      vy = (vy / speed) * maxSpeed;
    }
    actor.xspeed = vx;
    actor.yspeed = vy;
  };

  const addFriction = (actor, deltaTime) => {
    const bf = 1 - 0.5 * Math.min(deltaTime / 250, 1);
    if (actor.xspeed != 0) actor.xspeed *= bf;
    if (actor.yspeed != 0) actor.yspeed *= bf;
  };

  const spark = (x, y, angle) => {
    const bullet = util.createSvgElement('svg', {
      style:
        'fill:none;stroke-width:3px;stroke:#ffffff;width:3px;stroke-linecap:round',
      viewBox: '0 0 3 5',
    });
    const bpath = util.createSvgElement('path', {
      'vector-effect': 'non-scaling-stroke',
      d: 'M 1.5,1.5 1.5,3.5',
    });
    bullet.appendChild(bpath);
    playfield.appendChild(bullet);

    let cy = y;
    let cx = x;
    let rad = (angle * Math.PI) / 180;
    const ax = Math.sin(rad);
    const ay = -Math.cos(rad);
    const speed = 0.05 + Math.random() * 0.15;
    //console.log(hero);
    //cx+=ax*3;
    //cy+=ay*3;
    //console.log(cx,cy);
    //svgRoot.style.top=`${cx}px`;
    //svgRoot.style.left=`${cy}px`;
    bullet.style.transform = `rotate(${hero.angle}deg)`;
    addActor({
      type: 'spark',
      element: bullet,
      angle: hero.angle,
      x: cx,
      y: cy,
      w: 3,
      h: 5,
      xspeed: ax * speed,
      yspeed: ay * speed,
      size: 5,
      distance: 0,
      maxDistance: 50 + Math.random() * 50,
    });
  };

  const sparx = (x, y) => {
    //console.log("Fizz",x,y)
    let count = 3 + Math.floor(Math.random() * 3);
    let angle = Math.random() * 360;
    for (let i = 0; i <= count; i++) {
      spark(x, y, (angle += 60 + Math.random() * 60));
    }
  };

  const fire = () => {
    //console.log("pew");

    const bullet = util.createSvgElement('svg', {
      style:
        'fill:none;stroke-width:3px;stroke:#ffffff;width:3px;stroke-linecap:round',
      viewBox: '0 0 3 5',
    });
    const bpath = util.createSvgElement('path', {
      'vector-effect': 'non-scaling-stroke',
      d: 'M 1.5,1.5 1.5,3.5',
    });
    bullet.appendChild(bpath);
    playfield.appendChild(bullet);

    let cy = hero.y + 16;
    let cx = hero.x + 9.75;
    let rad = (hero.angle * Math.PI) / 180;
    const ax = Math.sin(rad);
    const ay = -Math.cos(rad);
    //console.log(hero);
    cx += ax * 20;
    cy += ay * 20;
    //console.log(cx,cy);
    //svgRoot.style.top=`${cx}px`;
    //svgRoot.style.left=`${cy}px`;
    bullet.style.transform = `rotate(${hero.angle}deg)`;
    addActor({
      type: 'bullet',
      element: bullet,
      angle: hero.angle,
      x: cx,
      y: cy,
      w: 3,
      h: 5,
      xspeed: ax * 0.4,
      yspeed: ay * 0.4,
      size: 5,
      distance: 0,
      maxDistance: Math.max(pfb.width, pfb.height) / 2,
    });
  };

  const actorvate = (element, bounds, pfr, angle = undefined) => {
    let cy = bounds.top - pfr.top;
    let cx = bounds.left - pfr.left;
    if (angle === undefined) angle = Math.random() * 360;
    let rad = (angle * Math.PI) / 180;
    let speed = 0.05 + Math.random() * 0.05;
    const ax = Math.sin(rad);
    const ay = -Math.cos(rad);
    element.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;
    return addActor({
      type: 'debris',
      element: element,
      angle: 0, //hero.angle,
      x: cx,
      y: cy,
      w: bounds.width,
      h: bounds.height,
      xspeed: ax * speed,
      yspeed: ay * speed, //,
      //size:5
    });
  };

  const cleanUp = (node) => {
    if (node === backplane) return;
    let parent = node.parentNode;
    range.selectNode(node);
    pr = range.getBoundingClientRect();
    if (pr.width == 0 || pr.height == 0) {
      parent.removeChild(node);
      cleanUp(parent);
    } else {
      range.selectNodeContents(node);
      pr = range.getBoundingClientRect();
      if (pr.width == 0 || pr.height == 0) {
        parent.removeChild(node);
        cleanUp(parent);
      }
    }
  };

  const cleanUpSvg = (node) => {
    if (node === backplane) return;
    let parent = node.parentNode;
    //console.log("CSVG",node.nodeName,node.getBoundingClientRect());
    pr = node.getBoundingClientRect();
    /*range.selectNode(node);
        pr=range.getBoundingClientRect()*/
    if (pr.width == 0 || pr.height == 0) {
      parent.removeChild(node);
      cleanUpSvg(parent);
    } else {
      //console.log("dc",node);
      let mw = 0;
      let mh = 0;
      for (ce of node.children) {
        let tr = ce.getBoundingClientRect();
        mw = Math.max(mw, tr.width);
        mh = Math.max(mh, tr.height);
      }
      if (mw == 0 || mh == 0) {
        parent.removeChild(node);
        if (node.nodeName.toLowerCase() == 'svg') {
          cleanUp(parent);
        } else {
          cleanUpSvg(parent);
        }
      }
    }
  };

  const reScale = /scale\(\s*([-0-9.]+)\s*,?\s*([-0-9.]*)\s*\)/gim;
  const reMatrix =
    /matrix\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\)/gim;

  const getElementScale = (element) => {
    let sx, sy;
    let selfTransform = element.style.transform;

    //console.log([selfTransform,computedTransform]);
    let match = reScale.exec(selfTransform);
    if (match) {
      sx = parseFloat(match[1]);
      sy = parseFloat(match[2]);
      if (isNaN(sy)) sy = sx;
      return { x: sx, y: sy };
      //return {x:sx,y:sy}
    }
    match = reScale.exec(selfTransform);
    if (match) {
      sx = parseFloat(match[1]);
      sy = parseFloat(match[2]);
      return { x: sx, y: sy };
      //return {x:sx,y:sy}
    }
    let computedTransform = window.getComputedStyle(element).transform;
    match = reMatrix.exec(computedTransform);
    if (match) {
      const [_, a, b, c, d, e, f] = match;
      sx = parseFloat(a);
      sy = parseFloat(d);
      return { x: sx, y: sy };
      //return {x:sx,y:sy}
    }
    match = reScale.exec(computedTransform);
    if (match) {
      sx = parseFloat(match[1]);
      sy = parseFloat(match[2]);
      if (isNaN(sy)) sy = sx;
      return { x: sx, y: sy };
      //return {x:sx,y:sy}
    }
    return { x: 1, y: 1 };
    //if (sx!==undefined) return {x:sx,y:sy};
  };

  const divisionScale = 0.75;
  const minDivisionSize = 20;

  const divideElement = (element) => {
    srcSale = getElementScale(element);
    element.style.position = 'absolute';
    let bounds = element.getBoundingClientRect();
    if (
      bounds.width * divisionScale < minDivisionSize ||
      bounds.height * divisionScale < minDivisionSize
    ) {
      return false;
    }
    //console.log(element.style.transform);
    let cy = bounds.top + pfb.top;
    let cx = bounds.left + pfb.left;
    let angle = Math.random() * 360;
    let rad1 = (angle * Math.PI) / 180;
    let speed1 = 0.05 + Math.random() * 0.05;
    let rad2 = ((angle + 180) * Math.PI) / 180;
    let speed2 = 0.05 + Math.random() * 0.05;
    const ax = Math.sin(rad1);
    const ay = -Math.cos(rad1);
    const ax2 = Math.sin(rad2);
    const ay2 = -Math.cos(rad2);
    element.style.transform = `rotate(${Math.random() * 10 - 5}deg) scale(${
      srcSale.x * divisionScale
    }, ${srcSale.y * divisionScale})`;
    bounds = element.getBoundingClientRect();
    //console.log(bounds);
    let clelement = element.cloneNode(true);
    element.parentElement.appendChild(clelement);
    addActor({
      type: 'debris',
      element: element,
      angle: 0, //hero.angle,
      x: bounds.left - pfb.left,
      y: bounds.top - pfb.top,
      w: bounds.width,
      h: bounds.height,
      xspeed: ax * speed1,
      yspeed: ay * speed1, //,
      //size:5
    });
    addActor({
      type: 'debris',
      element: clelement,
      angle: 0, //hero.angle,
      x: bounds.left - pfb.left,
      y: bounds.top - pfb.top,
      w: bounds.width,
      h: bounds.height,
      xspeed: ax2 * speed2,
      yspeed: ay2 * speed2, //,
      //size:5
    });
    //console.log(element.style.transform);
    return true;
  };

  const fragmentSvg = (node, bounds) => {
    console.log('frag', node, bounds);
    let srcSVG = node.closest('svg');
    let leaf = util.cloneBranch(node, srcSVG);
    let newSvg = leaf.getRootNode();
    //let op = newSvg.style.opacity;
    //newSvg.style.opacity=0;
    playfield.appendChild(newSvg);
    //console.log(newSvg.getBBox());
    newSvg.style.width = `${bounds.width}px`;
    newSvg.style.maxWidth = `${bounds.width}px`;
    newSvg.style.height = `${bounds.height}px`;
    newSvg.style.maxHeight = `${bounds.height}px`;
    //console.log(leaf.getBBox())
    let b = newSvg.getBBox();
    newSvg.setAttribute('viewBox', `${b.x} ${b.y} ${b.width} ${b.height}`);
    newSvg.style.top = `${bounds.top - pfb.top}px`;
    newSvg.style.left = `${bounds.left - pfb.left}px`;
    //newSvg.style.transform="scale(-2.3,-5)";
    if (!divideElement(newSvg)) {
      newSvg.parentElement.removeChild(newSvg);
    }
    //actorvate(newSvg,bounds,pfb);
    //console.log(newSvg.getBoundingClientRect().width)
    //newSvg.style.transform+=" scale(0.5)";
    //console.log(newSvg.getBoundingClientRect().width)
  };

  const promoteTextNode = (node, bounds) => {
    let layoutDiv = util.createElement('div');
    layoutDiv.setAttribute('style', 'position:absolute');
    layoutDiv.style.top = `${bounds.top - pfb.top}px`;
    layoutDiv.style.left = `${bounds.left - pfb.left}px`;
    layoutDiv.style.width = `${bounds.width}px`;
    layoutDiv.style.height = `${bounds.height}px`;
    layoutDiv.textContent = node.textContent;
    playfield.appendChild(layoutDiv);
    let parent = node.parentNode;
    parent.removeChild(node);
    cleanUp(parent);
    rebuildBgHitboxes();
    return layoutDiv;
  };

  const promoteSVGNode = (node, bounds) => {
    let srcSVG = node.closest('svg');
    let leaf = util.cloneBranch(node, srcSVG);
    let newSvg = leaf.getRootNode();
    playfield.appendChild(newSvg);
    newSvg.style.width = `${bounds.width}px`;
    newSvg.style.maxWidth = `${bounds.width}px`;
    newSvg.style.height = `${bounds.height}px`;
    newSvg.style.maxHeight = `${bounds.height}px`;
    let b = newSvg.getBBox();
    newSvg.setAttribute('viewBox', `${b.x} ${b.y} ${b.width} ${b.height}`);
    newSvg.style.position = 'absolute';
    newSvg.style.top = `${bounds.top - pfb.top}px`;
    newSvg.style.left = `${bounds.left - pfb.left}px`;
    let parent = node.parentNode;
    parent.removeChild(node);
    cleanUpSvg(parent);
    rebuildBgHitboxes();
    return newSvg;
  };

  const promoteElementNode = (node, bounds) => {
    let newSvg = node.cloneNode(true);
    newSvg.removeAttribute('id');
    newSvg.style.position = 'absolute';
    newSvg.style.top = `${bounds.top - pfb.top}px`;
    newSvg.style.left = `${bounds.left - pfb.left}px`;
    newSvg.style.width = `${bounds.width}px`;
    newSvg.style.maxWidth = `${bounds.width}px`;
    newSvg.style.height = `${bounds.height}px`;
    newSvg.style.maxHeight = `${bounds.height}px`;
    if (newSvg.nodeName === 'INPUT') {
      //newSvg.style.background="rgba(0,0,0,0)";
      newSvg.style.zIndex = '-100';
    }
    if (newSvg.nodeName === 'TEXTAREA') {
      //newSvg.style.background="rgba(0,0,0,0)";
      newSvg.style.zIndex = '-100';
    }
    if (newSvg.nodeName === 'SELECT') {
      //newSvg.style.background="rgba(0,0,0,0)";
      newSvg.style.zIndex = '-100';
    }
    playfield.appendChild(newSvg);
    let parent = node.parentNode;
    parent.removeChild(node);
    cleanUp(parent);
    rebuildBgHitboxes();
    return newSvg;
  };

  const promoteNode = (node, bounds) => {
    if (node.nodeName == '#text') {
      return promoteTextNode(node, bounds);
    }
    let isSvg = !(node.closest('svg') == null);
    if (isSvg) {
      return promoteSVGNode(node, bounds);
    }
    return promoteElementNode(node, bounds);
  };

  const isTextActorElement = (element) => {
    return (
      (element.nodeName == 'DIV' || element.nodeName == 'SPAN') &&
      element.textContent.trim() != ''
    );
  };

  const fragmentText = (element, fd = 0) => {
    if (element.textContent.trim().length < 4) return false;
    let bounds = element.getBoundingClientRect();
    let parts = fragmentString(element.textContent);
    let layoutDiv = util.createElement('div');
    layoutDiv.style.position = 'absolute';
    layoutDiv.style.top = `${bounds.top - pfb.top}px`;
    layoutDiv.style.left = `${bounds.left - pfb.left}px`;
    layoutDiv.style.width = `${bounds.width}px`;
    layoutDiv.style.height = `${bounds.height}px`;
    let divs = [];
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) layoutDiv.appendChild(document.createTextNode(' '));
      let pdiv = util.createElement('div');
      pdiv.textContent = parts[i];
      pdiv.style.display = 'inline-block';
      layoutDiv.appendChild(pdiv);
      divs.push({ div: pdiv });
    }
    playfield.appendChild(layoutDiv);
    for (let pdiv of divs) {
      let span1 = pdiv.div;
      let s1b = span1.getBoundingClientRect();
      //console.log(span1.textContent,s1b);
      //span1.style.position="absolute";
      let t = s1b.top - pfb.top;
      let l = s1b.left - pfb.left;
      let w = s1b.width;
      let h = s1b.height;
      //console.log(l,t,w,h);
      span1.style.top = `${t}px`;
      span1.style.left = `${l}px`;
      span1.style.width = `${w}px`;
      span1.style.height = `${h}px`;
      //span1.style.position="absolute";
      pdiv.bounds = s1b;
    }
    playfield.removeChild(layoutDiv);
    let angle = Math.random() * 360;
    for (pdiv of divs) {
      pdiv.div.style.position = 'absolute';
      playfield.appendChild(pdiv.div);
      actorvate(pdiv.div, pdiv.bounds, pfb, angle).fd = fd + 1;
      angle += 360 / divs.length;
    }
    return true;
  };

  const fragmentElement = (element, fd = 0) => {
    srcSale = getElementScale(element);
    element.style.position = 'absolute';
    let bounds = element.getBoundingClientRect();
    if (
      bounds.width * divisionScale < minDivisionSize ||
      bounds.height * divisionScale < minDivisionSize
    ) {
      return false;
    }
    let angle = Math.random() * 360;
    let newElement = element.cloneNode(true);
    newElement.style.transform = `scale(${srcSale.x * divisionScale}, ${
      srcSale.y * divisionScale
    })`;
    playfield.appendChild(newElement);
    actorvate(newElement, newElement.getBoundingClientRect(), pfb, angle).fd =
      fd + 1;
    newElement.style.transform += ` scale(${srcSale.x * divisionScale}, ${
      srcSale.y * divisionScale
    })`;
    angle += 180;
    newElement = element.cloneNode(true);
    playfield.appendChild(newElement);
    newElement.style.transform = `scale(${srcSale.x * divisionScale}, ${
      srcSale.y * divisionScale
    })`;
    actorvate(newElement, newElement.getBoundingClientRect(), pfb, angle).fd =
      fd + 1;
    newElement.style.transform += ` scale(${srcSale.x * divisionScale}, ${
      srcSale.y * divisionScale
    })`;
    return true;

    //console.log(element.style.transform);
    let cy = bounds.top + pfb.top;
    let cx = bounds.left + pfb.left;
    let rad1 = (angle * Math.PI) / 180;
    let speed1 = 0.05 + Math.random() * 0.05;
    let rad2 = ((angle + 180) * Math.PI) / 180;
    let speed2 = 0.05 + Math.random() * 0.05;
    const ax = Math.sin(rad1);
    const ay = -Math.cos(rad1);
    const ax2 = Math.sin(rad2);
    const ay2 = -Math.cos(rad2);
    element.style.transform = `rotate(${Math.random() * 10 - 5}deg) scale(${
      srcSale.x * divisionScale
    }, ${srcSale.y * divisionScale})`;
    bounds = element.getBoundingClientRect();
    //console.log(bounds);
    let clelement = element.cloneNode(true);
    element.parentElement.appendChild(clelement);
    addActor({
      type: 'debris',
      element: element,
      angle: 0, //hero.angle,
      x: bounds.left - pfb.left,
      y: bounds.top - pfb.top,
      w: bounds.width,
      h: bounds.height,
      xspeed: ax * speed1,
      yspeed: ay * speed1, //,
      //size:5
    });
    addActor({
      type: 'debris',
      element: clelement,
      angle: 0, //hero.angle,
      x: bounds.left - pfb.left,
      y: bounds.top - pfb.top,
      w: bounds.width,
      h: bounds.height,
      xspeed: ax2 * speed2,
      yspeed: ay2 * speed2, //,
      //size:5
    });
    //console.log(element.style.transform);
    return true;
  };

  const explnode = (node, bounds, actor) => {
    let element = node;
    let fd = 0;
    if (actor === undefined) {
      if (fd == 0) playSfx(this.sfx.xlarge);
      element = promoteNode(node, bounds);
    } else {
      fd = actor.fd;
      if (fd == 0) playSfx(this.sfx.xlarge);
      if (fd == 1) playSfx(this.sfx.xmedium);
      if (fd == 2) playSfx(this.sfx.xsmall);
      if (actor.fd >= 2) return removeActor(actor);
    }

    //console.log("explnode",element.nodeName,actor);
    if (isTextActorElement(element)) {
      if (fragmentText(element, fd)) {
      }
      if (actor === undefined) {
        element.parentElement.removeChild(element);
      } else {
        removeActor(actor);
      }
    } else {
      fragmentElement(element, fd);
      if (actor === undefined) {
        element.parentElement.removeChild(element);
      } else {
        removeActor(actor);
      }
    }

    return;

    let parent = node.parentNode;

    let ns = node.nextSibling;
    //let pfr=playfield.getBoundingClientRect();

    let isSvg = false;
    if (node.nodeName == '#text') {
      parent.removeChild(node);
      fragmentText(node.textContent, bounds);
      // console.log("hande",node.textContent)
      // const makeElement = (name)=>{return document.createElement(name)};
      // let svgRoot = makeElement('span');
      // svgRoot.textContent=node.textContent;
      // svgRoot.setAttribute("style","position:absolute")
      // svgRoot.style.width=`${bounds.width}px`;
      // svgRoot.style.height=`${bounds.height}px`;
      // let cy=bounds.top-pfr.top;
      // let cx=bounds.left-pfr.left;
      // let rad=(Math.random()*360)*Math.PI/180;
      // let speed=Math.random()*0.1;
      // const ax=Math.sin(rad);
      // const ay=-Math.cos(rad);

      // //cx+=ax*20;
      // //cy+=ay*20;
      // //svgRoot.style.top=`${cx}px`;
      // //svgRoot.style.left=`${cy}px`;
      // svgRoot.style.transform=`rotate(${Math.random()*10-5}deg)`;
      // actors.push({
      //     type:"debris",
      //     element:svgRoot,
      //     angle:0,//hero.angle,
      //     x:cx,
      //     y:cy,
      //     w:3,
      //     h:5,
      //     xspeed:ax*speed,
      //     yspeed:ay*speed,
      //     size:5
      // });
      // //svgRoot.classList.add(")
      // //svgRoot.setAttribute("style","fill:none;stroke-width:3px;stroke:#ffffff;width:3px;stroke-linecap:round")
      // //svgRoot.setAttribute("viewBox","0 0 3 5")
      // //let path = makeElement('path');
      // //path.setAttribute("vector-effect","non-scaling-stroke");
      // //path.setAttribute("d","M 1.5,1.5 1.5,3.5");
      // //svgRoot.appendChild(path);
      // playfield.appendChild(svgRoot);
    } else {
      isSvg = !(parent.closest('svg') == null);
      if (isSvg) {
        fragmentSvg(node, bounds);
        parent.removeChild(node);
      } else {
        if (!divideElement(node)) {
          node.parentElement.removeChild(node);
          if (actor !== undefined) removeActor(actor);
        }
      }
    }
    //if (ns && ns.nodeName=="BR") parent.removeChild(ns);

    if (isSvg) {
      cleanUpSvg(parent);
    } else {
      cleanUp(parent);
    }
    rebuildBgHitboxes();
  };

  const checkCollisions = (pfr, root = undefined) => {
    let ra = [];
    for (let actor of actors) {
      if (actor.type == 'bullet') {
        cx = actor.x + pfb.left;
        cy = actor.y + pfb.top;
        //console.log(actor.x+pfr.left);
        hit = checkCollisionsAt(cx, cy);
        if (hit) {
          //console.log(hit);
          //removeActor(actor);
          sparx(cx, cy);
          ra.push(actor);
          explnode(hit.node, hit.bounds, hit.actor);
          //return;
        }
      }
    }
    removeActors(ra);
  };

  const checkCollisionsAt = (x, y, root = undefined) => {
    for (let actor of actors) {
      if (actor.type == 'hero') continue;
      if (actor.type == 'bullet') continue;
      let rb = actor.element.getBoundingClientRect();
      if (rb.left <= x && rb.right >= x && rb.top <= y && rb.bottom >= y) {
        return { node: actor.element, actor: actor };
      }
    }
    for (let hb of bgHitboxes) {
      let er = hb.bounds;
      if (er.left <= x && er.right >= x && er.top <= y && er.bottom >= y) {
        return hb;
      }
    }
    return undefined;
  };

  const createBgHitbox = (rect, node) => {
    bgHitboxes.push({
      bounds: rect,
      node: node,
    });
    //let nd=document.createElement("div");
    //nd.setAttribute("style",`position:fixed;top:${rect.y}px;left:${rect.x}px;width:${rect.width}px;height:${rect.height}px;background-color:red;pointer-events:none;opacity:0.3`);
    //document.getElementsByTagName("body")[0].appendChild(nd);
  };

  const redrawBgHitboxes = () => {
    let hbs = [];
    let dhbs = document.getElementsByClassName('dbgHitbox');
    for (let dhb of dhbs) {
      hbs.push(dhb);
    }
    for (hb of hbs) {
      hb.parentElement.removeChild(hb);
    }
    for (let hb of bgHitboxes) {
      let rect = hb.bounds;
      let nd = document.createElement('div');
      nd.setAttribute(
        'style',
        `position:fixed;top:${rect.y}px;left:${rect.x}px;width:${rect.width}px;height:${rect.height}px;background-color:red;pointer-events:none;opacity:0.3`
      );
      nd.classList.add('dbgHitbox');
      document.getElementsByTagName('body')[0].appendChild(nd);
    }
  };

  const buildSvgHitBoxes = (root) => {
    let rnn = root.nodeName.toLowerCase();
    if (root.children.length > 0) {
      for (let i = 0; i < root.children.length; i++) {
        buildSvgHitBoxes(root.children[i]);
      }
    } else {
      let rect = root.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        createBgHitbox(rect, root);
      }
    }
  };

  const rebuildBgHitboxes = (root = undefined) => {
    if (root === undefined) root = backplane;
    if (root === backplane) bgHitboxes.splice(0, bgHitboxes.length);
    let rnn = root.nodeName.toLowerCase();
    //console.log(rnn);
    if (rnn == 'svg') {
      buildSvgHitBoxes(root);
      return;
    }
    if (root.nodeName == 'BUTTON') {
      range.selectNode(root);
      let rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        createBgHitbox(rect, root);
      }
      return;
    }
    if (root.nodeName == 'SELECT') {
      range.selectNode(root);
      let rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        createBgHitbox(rect, root);
      }
      return;
    }
    if (root.nodeName == 'INPUT') {
      range.selectNode(root);
      let rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        createBgHitbox(rect, root);
      }
      return;
    }
    if (root.childNodes.length > 0) {
      for (let i = 0; i < root.childNodes.length; i++) {
        rebuildBgHitboxes(root.childNodes[i]);
      }
    } else {
      if (root.nodeName == '#text') {
        if (root.textContent.trim() == '') return;
      }
      range.selectNodeContents(root);
      let rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        createBgHitbox(rect, root);
      } else {
        if (root.nodeName != 'DIV') {
          range.selectNode(root);
          rect = range.getBoundingClientRect();
          //console.log("howto",rect,root.nodeName);
          if (rect.width > 0 && rect.height > 0) {
            createBgHitbox(rect, root);
          }
        }
      }
    }

    if (root == backplane && game.debug) {
      //redrawBgHitboxes();
    }
  };

  const updateBackplane = () => {
    pfb = playfield.getBoundingClientRect();
    rebuildBgHitboxes();
  };

  const initBackplane = () => {
    backplane = document.querySelector('div.piece.output');
    backplane.addEventListener('scroll', updateBackplane);
    window.addEventListener('resize', updateBackplane);
  };

  const initHero = () => {
    const ship = util.createSvgElement('svg', {
      style:
        'fill:rgba(0,0,0,0.5);stroke-width:2px;stroke:#ffffff;width:20px;z-index:100',
      viewBox: '0 0 20 32',
    });
    const hull = util.createSvgElement('path', {
      'vector-effect': 'non-scaling-stroke',
      d: 'M 10,1 19,27 14,24 6,24 1,27 Z',
    });
    const thrust = util.createSvgElement('path', {
      'vector-effect': 'non-scaling-stroke',
      d: 'm 6,24 1,4 3,3 3,-3 1,-4',
      style: 'display:none',
    });
    ship.appendChild(hull);
    ship.appendChild(thrust);
    let lb = document.querySelector('#logo').getBoundingClientRect();
    let sx = lb.left + pfb.left;
    let sy = lb.top + pfb.top;
    ship.style.x = pfb.left + pfb.width / 2;
    playfield.appendChild(ship);
    hero = {
      type: 'hero',
      element: ship,
      thrustElement: thrust,
      angle: 0,
      x: sx,
      y: sy,
      xspeed: 0,
      yspeed: 0,
      size: 32,
    };
    addActor(hero);
  };

  const initPlayfield = () => {
    initBackplane();
    playfield = util.createElement('div', {
      id: 'playfield',
      class: 'piece noclick',
      style: `z-index: -1;overflow: hidden;position: absolute;top:0px;left:0px;`,
    });
    backplane.parentElement.insertBefore(playfield, backplane.nextSibling);
    updateBackplane();
    initHero();
  };

  this.sfx = {};
  const initSfx = () => {
    game.sfx['fire'] = new Audio(sfxData.fire);
    game.sfx['thrust'] = new Audio(sfxData.thrust);
    //game.sfx['thrust'].loop=true;
    // game.sfx['thrust'].addEventListener('timeupdate', function(){
    //     // var buffer = .094
    //     // if(this.currentTime > this.duration - buffer){
    //     //     this.currentTime = 0
    //     //     this.play()
    //     // }
    //     if((this.currentTime / this.duration)>0.65){
    //         this.currentTime = 0;
    //         this.play();
    //       }
    // });
    // game.sfx['thrust'].addEventListener('ended', function() {
    //     this.currentTime = 0;
    //     this.play();
    // }, false);
    game.sfx['xlarge'] = new Audio(sfxData.bangLarge);
    game.sfx['xmedium'] = new Audio(sfxData.bangMedium);
    game.sfx['xsmall'] = new Audio(sfxData.bangSmall);
  };

  const sfxPlayPool = {};

  const playSfx = (sfx) => {
    if (iOS) return;
    if (sfxPlayPool[sfx.src] === undefined) sfxPlayPool[sfx.src] = [];
    const pool = sfxPlayPool[sfx.src];
    if (pool.length == 0) pool.push(sfx.cloneNode());
    let se;
    for (se of pool) {
      if (se.paused) break;
    }
    if (!se.paused) {
      se = sfx.cloneNode();
      pool.push(se);
    }
    se.play();
    //console.log("fp",pool.length)
  };

  this.initialise = () => {
    if (playfield) return;
    console.log('init game');
    if (!iOS && window.parent === window)
      document.querySelector('body').requestFullscreen();
    initSfx();
    document.body.addEventListener('touchend', (e) => {
      e.preventDefault();
    });
    initPlayfield();
    requestAnimationFrame(main);
    if (game.debug) {
      window.addEventListener('mouseup', (e) => {
        let x = e.clientX;
        let y = e.clientY;
        //hero.x=x-pfb.left;
        //hero.y=y-pfb.top;
        //console.log(e.clientX,e.clientY);
        //let r=backplane.getBoundingClientRect();
        //console.log(r);
        //x-=r.left;
        //y-=r.top;
        sparx(x - pfb.left, y - pfb.top);
        let hit = checkCollisionsAt(x, y);
        if (hit) {
          //console.log(hit);
          sparx(x - pfb.left, y - pfb.top);
          explnode(hit.node, hit.bounds, hit.actor);
        }
        e.preventDefault();
      });
    }
  };

  let thrustSfxCooldown = 0;
  const main = (time) => {
    if (lastTime === undefined) lastTime = time;
    const deltaTime = time - lastTime;
    if (deltaTime > 0) {
      //let pfr=playfield.getBoundingClientRect();
      let ls = getButtonState('unified', 'left');
      let rs = getButtonState('unified', 'right');
      let as = getButtonState('unified', 'a');
      let bs = getButtonState('unified', 'b');
      let us = getButtonState('unified', 'up');
      if (ls.pressed) {
        hero.angle -= 0.36 * deltaTime;
        hero.element.style.transform = `rotate(${hero.angle}deg)`;
      }
      if (rs.pressed) {
        hero.angle += 0.36 * deltaTime;
        hero.element.style.transform = `rotate(${hero.angle}deg)`;
      }
      if (as.pressed || us.pressed) {
        hero.thrustElement.style.display = 'inline';
        //this.sfx.thrust.play();
        if (thrustSfxCooldown == 0) {
          playSfx(this.sfx.thrust);
          thrustSfxCooldown = this.sfx.thrust.duration * 1000;
        }
        addImpulse(hero, deltaTime, 0.3);
      } else {
        hero.thrustElement.style.display = 'none';
        //this.sfx.thrust.pause();
        //playSfx(this.sfx.thrust);
        addFriction(hero, deltaTime);
      }
      if (bs.pressed && cooldown == 0) {
        //checkCollisions(pfr);
        //this.sfx.fire.play();
        playSfx(this.sfx.fire);
        fire();
        cooldown = 100;
      }
      if (cooldown > 0) {
        cooldown -= deltaTime;
        cooldown = Math.max(cooldown, 0);
      }
      if (thrustSfxCooldown > 0) {
        thrustSfxCooldown -= deltaTime;
        thrustSfxCooldown = Math.max(thrustSfxCooldown, 0);
      }
      moveActors(deltaTime);
      checkCollisions();
    }
    lastTime = time;
    requestAnimationFrame(main);
  };
})();

const sfxData = {
  fire: 'data:audio/wav;base64,UklGRqQLAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YYALAAB9fn56en5+fYOFioiJhYB8cGlTi6WSioN8dXV1dXyFh42XmqhjSVREcaubpJ2fl6dkO0Q7Y6eep6Okn6VqOkxBXqaan5yfm6Z6QktEUqKcnp2gnqaJQ0hDSpSbmp+gpaWZR0dGQoigmpqfop+iWERPQnShlp2cop2mbkFPQl6hmJuboJ+lhEhNR06WkpebnKKdo1hNUUJ5mZCVmZ+hqXhIUUNgmZKXmpydnpJLTk5NjZmYmpmdmKNnR1JFaZ6WmZmZnZ6OTFFMS5CXl5ecnZeibEZRRmaclJeYnZ2dlVJOTkiEmZaZmZqXoH5MU01Yl5WamZOVk5piUlpQcJqUlpeUlpiTVlFTS4SXl5aZm5eehE1TU06QkpeXmpqXnndMWUxalJSXl5eXl51wTVlMYpiRmJWVmZafaU9XT2qXkJaSlpmWmmlPVkxtm5GXl5qZlJZeSlZOcqGUmpSWl5GWaE5WTG2YkpaYl5aVm29OVk1nlZGWkpaZkp53TVlSXpSQlJOWlJeXh1FZVVWLkZGRlZaZlpJaVlpOfpWPkZaWlpGXalFaUm2XjpeWlZSQkHdRXFdflZSUkJKRk5GTXFdYU3uWj5WUk5STl3dTWlNgkpCSkpKSlpGRYVhaUHuTjZCUlJSVlX1VW1Vbj4+Rj5GRlZKZaVZcVnCRi5CQkpGSko9eW1tYg5SQjo2LjY2SiF9fXl6NioyMkJCTj5Z6WFtYZI+OkZGQj5GPlXBWYFZpk4mQkI+RlJCUblddV26PjY+PkJCUjpRvWVtVbZKMkpCQkJKQlnFWXFZokYuOj5SUlZGUeVZdVVqIjJGVmpSTj5CCVV1ZW4eNjo+PkpKRlI9eXVxVfY6Kj4+RkY+QlW1ZX1hskIqNjpCQkI6QiFtfX1qHio6OipCOj4+VblpgVnGQiYyMjJGNjZKGXWBeXoiQjIuKiImNjJd6XmRabIuKiIqMjoyQjpJlYWBZd42JjIuPj46Pj4tfX19ZgoiIj46QjpCOj4FdYGBdhomKjoqOjpCLj4JgY2BghImJjIyMjJCMkIRdYl9fiI2NjYyLjYiGiIZmZWdkhoiIiYeJi42PjY5mYGZbe4yGjYyLi4qOipF0X2NcboyEjIiPjo6Oio+BXmZeYYKIi46Kjo6OioqObF5iW3WQiYmKjY2MjIqNhF5iX2CHjomOjYyLhYuGi3VhaGVuiYiKh4mLiouMjY1uYGRdc46FiomJjIyMjI2NaWBjXHeIiIuKio6Kjo6OiWZgZV14iYaHiouLjIyNjY1vYWNcdYuDiIiIiY2LjoyPdWBlYW2MhYSCgIeLjpaWkYRhZF9mhIWHiouRhISJiYmJaGBjYHeMhImMjIyLi4uIi31eZmZmh4eKh4qKioqHioeOb2JnYnSIg4mJjIyMjIyMjY1qZGRdd4SDhISEiYmJiIiDgl9fYmKIlZGVlZWRi4+IiIODZ2BgXHWEg4SJiYmJiYmJiYxuY2NgdYOCiIiLi4+KjoqKjnxhZ2Fnh4eHh4iLi4iLiIyJiWljY2B3ioWFhYqJiYmJiYSJe19fX2KCgoKHjpSUl5SUkI6KdV5nW2iCgoKEhISEhISJiYqNdmRpZHKJg4SEiYmJiYuLi4uLemJnYWyHgoeHh4eHh4qHh4iIgmJnZ2eCiIiIiIuIiIiIiIiDiG1iZl5vgXyCgYKKkJCUlJCQjoNnZ2difYODg4SDhISFioqFhYp8ZGlpaoSDhISEiYSIiIuIi4iLfGZnZ2eCh4KIg4iIi4iIiYmJiYNoaWlkf4WFhYWFhYWFhYWFhIOEbmNjYGiCg4+RmJWVkY+LiIiDg4JnX2JfdoJ9goODiYmJiYmJiYmJg2hoZ2J6g4OIiIiIi4iIi4eHioKDbWhnYnqIg4ODg4OIiYmJiYmJhIl3aGlobYOCg4ODg4ODg4GBgYGCh45zb3VsgouIiIiDg4OEg4SDhIODhYRpZGlkeIWEhYSJhISJhISDiIiLiItwZ2dmc4eBh4eHiIOIiIiDg4SJhIl+Y2hpaYSEhISFhYWFhYSEhISDg4ODdF9iX22LjpSQkI6KioeHg4OCgoKCgntgaGNjfoODhISEiYmJiYSEhImEhIOIcGdtZ3SIgoKCh4eCh4eDg4iIiIODg4RuaGlod4mDhYWKhYWFhYODg4OEhISDg3BfYltog4OKjpCQkJCOi4iIg4OCgoKDg2hjY2B1g3+EhIWFhYWJhISEg4SEhIiDiHRoaGh0iIKHgoeDiIiDiIiIg4ODhISEg4NoaGhje4ODg4OEhISDg4ODgoKDgoJ9fIGHdXN5c4KKgoeBgoGBgYKCgoKCgoKDg4OEhH5oaWlofoSDg4SEgoODiIiIiIOIiIOIg4ODg21nZ2d2g4KIg4SEhISEhImEhISEhISEhISDg2lnZ2J2gn19fHyBgYKHjpCUkI6OioeDg4KCfXZgY2Boe36EhISEhIWFhYWFhYWFhYODg4SEhISEbWhoZ3aDgoODg4OIg4OJiYSEhISEhISDg4ODg4NxY2hjcYN+g32CgoKCfYKBgXyCio6QlJCOioeCgoJ0X2dfaH17fn6Dg4ODhISEhISJhISDhISEg4ODhISCemhoaGiCgoKDgoKDiIODg4iIg4ODg4OEhISEhIODgoKCaGdnYnaCfYGBgYGBgXyBgYGCio6OkJCOioqHgoKCfX19dGBjY2N7f39/hISEhYWFhYWFhYSDg4OEiYSIg4ODg4OCg4J9aGdoZ3qCgoKCg4OEg4ODhISEhIWEhISEhISEhH5+fn6Dfn59dl9iZ22HkJCOjoqHgoGBfIF8gX19fYJ9goODfoSEg4OEg4ODg4ODfmhjaGh+g4KDg4iDgoKCgoKCgoKCgoGBgYKCgoKDg4ODg4ODhISEhH+EcmRpZG9+foN+fn19fYKCh4qKkI6OioeHgYF8fHl8fHp9en19fn5+g4ODhISEb2pvaXiFg4SDhImJg4iDg4ODgYKBgoGBfIGBfH19fX19fX1+fn6Dg4ODg4OEg4SEfmlpaWl+goKCgoKCgYKKkJCQjoqHgYF8fHl2dnZ2dnt7e3t7fH9/f4SEhISEhISEhIWEhIOEg21tbW2Cg4KCh4KCgoeCgoKCgoOCgoKDfn5+fn5/f3x8fHx8fHx/f397e35+fnt9fXp9goiLkJCQkIqKh4d1Z2dnaH19fX2Dg4ODg4ODhISDg4ODg4N9fX16fX2BfIF8gXyBfIGBfHyBgXx8gYGBgoKCg4OEhISEhISEhIWFhX+EcWNoY26DfoN+gn19fX2Dj5GRkY+LiIOCfX16fXp7e3t3e3t3e3x8f39/f39/f39/f36Dg4ODg4SDg4ODg4iDiIiDg4JoaG1nfYOCgoSEhISEhISEg4ODg4ODfn5+fn57e3t7e3Z6enZ2en2CiIuLi4uIg4OCgn19fX1+fn5+foODg4SDhIOEdWlpaHWCgoKCgoOIg4eHgoeCgoKCgYKBgYJ9gn19fX5+fn57fn58fHx/f39/f39/fn6Dg35+foKCgn19gnyBh46QkI5zb2xngYGBgX19goJ9goJ+foODg4ODg4N+fn5+g3t6en16fYJ9fIF8gYF8gYGBgoGBgYGBgYODg4ODg4SEhISEg4OEdWhpaG6Dg35+g4OCgoKCgn19fHyCh46Ojo6HgoKBfXp6dnZ6d3t3e3t7e3t/f39/hISDhIODg4ODgoKDg4OIgoeCh4FsZ2xmfIKCgoODg4iDg4SDhISEhISEhISEf3x8fHx8fHt3d3t7enZ2enZ1fIKKjo6OioqHgoKBgYJ9gn2CgoODg4OEdWhpaG6Eg4ODhISDgoKCgoGBgYGBgYB7e4CAe3uAgIGBgYGBiIiIiIyJjINxdnZ2dnZ4eHh4fHx/f4R+foODfn19fX2Ch4qOjo6Kh4KCgXx6fXp2enZ7e3d7e3t+f39/f39/f4OD',
  thrust:
    'data:audio/wav;base64,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oqGgoJ+enp2bmpiWlJKPi4iEgHx4c29rZmJeW1dVUlBOTUxMTExNTk9QUVJUVVZXWFlaWltbXFxdXl5fYGJjZWdpbG9ydXh7foKFiIuOkZSWmZudnqCio6SlpqeoqKmpqqqqqqqpqainpqSjoZ+dmpiVkpCNioeFgoB9e3l3dXNxb21samhmZGJgXlxaWFZUUlBOTUxLSkpKSktMTU9RU1ZZXF9jZ2pucnZ6foKGio+Tl5ufo6ersLS4vL/Dx8rN0NLV1tjZ2trb29rZ2djW1dTS0dDPzs3My8rJycjHx8bFw8LAvru5trOvq6ejn5qWkY2JhYF9end0cnBubGtqaWloaGhnZ2dnZ2dnZ2dnZ2dnaGhpamttbnBydHZ5e36BhIeKjZCTlpmcoKOmqayws7a6vcHEyMvO0tXY297g4+Xn6ers7e7u7+/v7u7t7ezq6ejm5OLg3tvY1dLOysbBvbizraiinZeSjIeCfXhzb2toZGFeXFlXVlRTUlFQT09OTk5PT1BRUlRWWFteYmZqb3R5foSJj5WboKarsLW5vsLFyczO0dPV19nb3d7g4ePk5ufp6uvt7u7v8PDw7+/u7evq6Obj4d7b2NXSz8zJxsO/vLm1sq6rp6Ofm5eSjomFgHt2cWxoY19aVlJOS0dEQj89Ozk3NjU0MzMyMjIyMzM0NTY3ODo8PkBCRUdKTVBTVlpdYGRna25ydXh8f4KFiYyPkpSXmpyfoaOlp6mqrK2ur7CxsrKzs7S1tba2t7i5uru8vb6/wMHBwsLCwsHAv727ubazsKyopKCcl5OPioaCf3t3dHFubGlnZWNhX15cWllYVlVUU1JRUVFRUVFSU1VWWFtdYGNmaW1wc3d6foGEiIuOkZSXmp2goqWoq66xtLe6vcDDxcjKzM7P0dHS0tLS0dHPzs3LycjGxMLAvry6uLazsa+tqqilop+cmZaSjouHg397d3NvbGhkYV5bWFVSUE1LSEZEQkA+PDs5ODc2NTU1NjY4OTs+QURITFBVWV5jaG1yd3yAhYmNkZWZnKCjpqqtsLS4u7/Dx8vP1Njc4OTo7O/z9fj6/P7//////////////v38+/n49vTy8O3r6OTh3dnV0czHwr24s66ppKCbl5OPjImGhIF/fXt5d3VycG1raGVhXlpWU09LSERBPzw6OTg3Nzg5Oz1AQ0dLT1RYXWJnbHF2e4CFio6TmJygpamtsbW5vcHFyMvO0dPV19jZ2tra2tnY19XU0tDOzMrIxsTBv727ube1srCtqqiloZ6bl5OQjIiEgX16d3RycG5sa2pqampqa2xtbm9xcnR1d3h5e3x+f4GChIaHiYuNj5KUlpmbnqCjpaiqrK6vsbK0tba2t7e3uLi4uLi4uLi3t7e3t7e2tra1tbSzsrKxsK+urayrqqqpqKioqKioqKioqampqampqamoqKempaSjoqCfnpybmpmYl5aVlZSUk5OTkpKSkpGRkJCQj4+Ojo6NjY2Ojo+QkZKUlpianJ6goqWnqautrrCxsrO0tbW1tra2t7e3uLi5uru8vb6/wMHCw8TFxsfHyMjIyMjIyMjHx8fGxsbFxcXExMTDw8LBwMC+vby6ube1s7GwrqyqqaempaSjo6KioaGhoaCgn5+enZuamJaUko+NioeFgoB9e3l4dnV0c3Nzc3N0dHV2d3h5enx9fn+BgoSFh4mLjpCTlpmcn6Kmqa2ws7e6vL/Bw8XHyMnJysrLy8vKysrKysrKy8vLy8vLy8vLysnIx8XDwb67uLSxramloZ6al5OQjouJh4aFhIODg4ODg4ODg4ODg4ODgoKBgH9/fn18e3p6eXh4d3d3dnZ2dXV1dHRzcnJxcG9ubW1sa2pqamlpampra2xtbm9xcnR1dnh5enwATElTVDAAAABJTkZPSVNGVCQAAABDb29sIEVkaXQgdi4xLjI5YSBieSBEYXZpZCBKb2huc3RvbgA=',
  bangLarge:
    'data:audio/wav;base64,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u7awq6ainZmVko+NiomHhoWEhISEhYWGh4iJioyNjpGZoKeutr7Fy9DT1NDLxsG7trGsp6KempaTj4yKh4WDgoCDiY6Sl5ygpKeqrq2ppaCcl5OOioaCfnt3dHJvbWtqaWdnbXJ3fYKHi4+Tl5mcnqChoqKioqKhoJqSioJ6c2tlYVxYV1laW1xeX2FjZGZlYFxXUk5KRkI/PTtARElOU1dcYWVpbWtoZmRhX1xaWFZUV11iZ2xydnuAhIiLjpGUlpiZmpucnJuUjoeBe3Vwa2ZiXltYVlRTUVBQUFJUVlhaWltcXF1fYGJkZmhqbG5xc3V4en+IkJifpq2zub7DxcK+u7i0sa2ppqKfnJmWk5GPjYuKiIeGhoWFhISEhISEhISFhYWGhoeHiIiJiYqKiouMjIyMjIyOlZ2jqrC1t7q9vr/AwMC/v768uri2tLGuq6ilop+bmJSRioB2bWRcVE5IQjw6PUBDRklNUFNXWlxYVVFOS0hFQ0E/PTw8Ozs7PD0+P0FDSlNbY2tyeYCHjJKTkY+Ojo2LiIWBfnt4dnRycXBvbm5ubm9vcHFyc3R2d3l7goqRmJ+lrLG3vMDEx8nLzc7Oz87OzczKyMbEwb+8ubazsKyppqKfnJiVko+LgnhvZ19YUUpFQDs9QENGSk9UWV9jZWNfW1ZST0tJRkRCREpPVVtgZmtxdXt8enh1c3FubGpoZ2ZmZmZmZmdoaWprbW9wcnR2eXt9f4GEipOboqqxt73Cx8zMyMXBvbm1sa2ppaGem5eVko+Ojo6NjYuJh4WEgoGAf39/hIqPlZqgpKissLO1t7m6u7u7urm4trWzsbCtq6imo6CdmpeUkY6LiIWCf3x5d3Rxbm1qaGVkYmBeXVtZWVdWVVRTUlJRUVBQT09OTk5QTklEPjgyLSgkIB0dIicsMjY7QEVKT1NYXGBkaGxwc3Z5fHp3dHJwb21sa2ppbHJ3fIGGi5CVmZ2hpairrbCys7W2t7ayraikn5uXk4+MioyPkpWYm56goqWmpaOhn5yYk4+LiISFh4qMj5KVl5qcnqCio6Slpqanp6empJ6Zk42Ig397d3Nxc3V4e36Bg4aIi42Kh4OAfXp2c3FvbG5ydXh8gIOGiYyOkJKUlZaYmJmZmZiYl5aWlpaWlZSSkI2KiIWCiJGXm56foKCfnZuZl5OQjYmGgn97d3RwbWlnZGJeVk9IQjw3Mi0qJiUoLC8zNztAREhMUFRYW15hZGdpbG5wcnRqXVROSUZERERFR0lLT1NZXmNnamtoZWNhYF5dXV1dXV5fYGJkZmlrbnFze4KIjJCWnaOprbK1t7q8vbu3s6+sp6Oem5eTkJGSk5OUlZWVlpaWlpaVlZSTk5KRkI+NjYV0aF5WUEtIR0RAPjs5NzUzMjIyNTtARUtQVlxhZmxvb3BwcXFycnN0dHZ7f4SJjpOXm5+jpqWkoqGfnpybmZiWlZSTkpKRkZCQkJCQkJCQkZGRkpKTk5WZnaGlqayvsbO1trSysa+sqKSfm5eTj4yIhYOAfnx6eXh5fX+ChYiLjI+QkpGOi4iFg4B9e3l3dnl6fH6BgoSGh4mJiouMjIyMjIyLiomJiIaGhIOBgH99fHhybWhjX1tXU1BNSkhGRUVGR0dISEdHR0dHSElKS0xOT1JYXmNpbnR5fYKGiY2QkpWXmZqbnZ6foKCgoKCgn56enZyZk4+KhYF8eHVxbm1vcHJ0dnh7fX+AgoSFhoiJiYqLi4yMjIuLi4qLjY6OjoyIgXx2cWxoZGFdW1hXVVRTUlNTU1RVVlhZWlxeYGJkZmlsb3Fzdnl7foCDhYeMk5idoqerr7O2ubu9v8DBwcHBwcDAvbeyraeinZmUkIyIhYJ+fHl3dXR0dHV5fH6AgoSGiImLjIqHhIF+e3l2dHJwcXR2eHt9gIKEhoeHhIKAf3x6eHZ0cnJ1d3p9f4KEh4mKjI6PkJGSkpOTk5OSkpGRkI+OjYyLiomFgHt2cW1oZGFeXF5hZGZnaWprbG5vcHJzdHV2eHh5ent7fHx8fX19fX19fX16dnFua2hlY2FfXVxbW1paW1tbXF1eYWdscnd8gYWKjpKVmJueoKKjo6SkpaWkpKSjoqKhoJ6dnJuampqamZiWk5GOjIqIhoSDgYB+fXx7enl5eHd3dnZ2dXRxbWpnZGFfXl1cW15hZGhrbnJ1eHt9fXx8e3p5eHd2dnV3e36BhIeKjZCSlZeZmpydnp+foKCgn5uXlJKRjoyIhYF+fn5/gIGCg4SFhoeGg4B+fHp4dnRycXBvbm1tbWxsbW5vcHFyc3R1d3d5ent9goaLj5OWmp2goqSmqKmqq6urq6uqqaahnZiUkIyIhIF9end1cnBubm5ubm1ucHJzdXd5e31+gIB+fHp4dXNxcG5sa2ppaGdnZmZmZmZnaGlqa2xtbnBxcnN2e3+EiIyPkpWYm52foKGio6Ojo6OioZ2ZlJCMiISAfXp3dHJvbWtqaGdoamptcHJ0dnh6e31/gYB+fHl3dnRxcG9tbXBydHZ5e31/gYOEhoiJiouNjY6Ojo6Ojo6OjYyMi4uKiYaBfXl1cm5raGZkYmBfXV1cXFxcXF1eY2dscHR3e36BhYmJiYmIhoOBfnx6eXp8foCChIaIioyNj5CRkpOUlJSVlZWVlJSTk5OUk5OSkpCMiISAfXl2c3FvbGtpaGdmZmZmZmZnZ2hpamttbm9xcnN3fIGGio6SlpmcnqCjp6qsra6sq6qppqGdl5OPioaCf3x5ent8fX+AgYKEhYWGiIiIiYqKi4uMjIyMi4uLioqJiYiHh4aFhISDgoGBgH9+fX18e3t6eXl4eHd3dnZ1dXR0dHNzc3JycXJzdXZ2dnV0cnFwb29ubW1tbGxsbGxsbG1tbW5ub29wcHFycnNzdHV2d3VycG5samhnZmVlZGRkZWVmZ2hpa2xwdXp/hImNkZWZnKCjpaepq6ytrq+vr6uno6CcmpmXlZOQjImGg4F/fXt6enl4eHd3eHh4eHl6ent8fX5+gICBgoOEhYeIiYuLjI2Oj5CQkZKSkpOTk5SUlJSXmZudn6Cio6SlpaShn52bmJaTkY+NjI2NjY2NjY2OkJCRkZCOjYuJh4WDgX97d3RwbWpnZGJgXlxbWVhYV1dWVlZXWVxfYmZpa25xc3V2dnV1dXRzc3JycXJ0dnh6fH1/gYKDhIOCgH99fHt6eXd3eHp7fX5/gYGChIaHh4aEgn99enh2dHJxb25tbWxra2tra2xsbW1ub29wcXJzdnp8gIOGiYuOkJKSkZCPjo2Mi4qJiIeGhYWEhIODgoKCg4WHiYuNjpCSk5SVlpaXl5eXl5eWlZSRj46MioiEgX16d3Ryb21samloZ2dmaGpsbnBzdXd5e319fHx7enl4eHh4d3h6fX+BgoSGiIqLjI2Oj5CQkZGRkZGRkZGQkJCPjo6NjIyJhoOAfnt5dnRzcW9ubGtsbm5vb25tbGxrampramprbGxtcHR3eXx/goSHiYuNjpCRkpOTlJWVlpeXl5eXl5aWlZWUk5OSkZCQj46NjIuKiYmIh4aFhISDgoGBgH9/fn59fXx8e3t6eXl4eHp7fHx8eXVyb2tpZmRhYF5eYGFjZWdpam1vcXJxcXBwcG9vb29vcHN2eXx/gYSGiYuNj5CSk5WWlpeYmJmZmZmZmZmYmJiXl5WSj4yKh4WCgH99e3p5d3d2dXR0dnh5fH+AgYOEhIWHiIiHhoWDgoF/fn18e3p6eXl5eHh4eHh4eXl6e3x9fX5/gIGChYiLjZCSlJaYmpqamJeVlJKQj42MiouMjY6Oj5CQkZKSkpKSkpKRkJCPjo6OjIqHhIB8eHVxbmtpZ2VjYmBgX19eXmFjZWhqbW9xdHV3d3d2dXV1dXV0dHR1d3l8foCCg4WHiIiHhoWDgoF/f318fH5/gIKDhYaHiYqKi4yMjY2OjY2NjYyKiIeFhIOAfHp3dHFvbWtqaWhnZ2ZmZ2psbnFzdnh7fX+Af39+fXx8e3t7e3p7fH1+f4CBgoOEhYaHh4iIiYmKioqKiomIh4aFhIODgoGBgIB/f39/f39/f35+fn6AgoOEhYWEg4ODg4SEhYWFhoaGhoWEhIOCgYCAf39/gIGBgoODhIWGh4iJiYqKi4uLi4yMi4qJiIeFhIOCgYB/f359fXx8fHt7e3t7e3t7e3t7e3t8fH1+f4CCg4SHiYyNjIyLiomIiIaGhYSDgoB+fXt6eHd2dXV0c3NycnJxcXFxcXJzc3R1dXZ3d3h5enx+f4GChIWGiImJiouLjIyMjY2NjYyLioiHhoSDgoGAf39/gICAgICBgoSGh4eGhYSDgoB/',
  bangMedium:
    'data:audio/wav;base64,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UVZcYmdscW9oYVtUTkhDPj1ES1JZWlZTUE1LSUdGRERDQ0NKV2Jtd3l4eHh3dnV1dHmEjpihqrK6wcfN0tba1s3FvLOqoZmRioN8dnBxeICIj46JhH58goeNkpGLhYB7f4WKkJKMhoF6e4GGi4+LhX95dG5pZWFeW1hWVFJRUVBTX2l0f4SCgYB/fXx6eHqEjZafoZ2bmJSQjouHho6WnqSssri9wr21rqegmpSPiYJ8dW9qbnR6gYSAe3dzbmpmY2BmbnZ9hYyTmZ+kqa2wsquimpGLjY+Rk5WXmZqcnZ2enpyQhXpvZVtRSUE6My0oJy42PkZJRUNBPz08Ozk5ODg5OTo7PD9DR0pOUFVhbnqGi4uLi4qKiYiHiZOcpa+yr6yppqOgnZmZoaivt7m0sa2qrrS6v8XJztLV08rBuLCnnpaOiY2RlJmYkIqDfYCFiY6Tl5ueo6CXj4d+d29nYFpUT0xKR0VCPz07Ojk4OTk6Oz0/QUNGSEtOUVRaZ3WCjpqmsLrDwr66trKuqaSfm5aSjouIhYKAfnx6eXh4d3d3d3d4eHl7h5Kcp7C5wsnQ1tvf4+Xl4t/c2tfU0s/Nx7qtoZ6alpOLfXFkWU5EOjEsLzQ4Pj44NC8rJyQhHh4nMDpDTFVeZ3Bva2djYFtXVFBSW2Nrc3NvbGlob3d/hoiEgHx4dHFtaWdlYmBeY212gIqLiYeFhI2VnKWppqOgm56kqK2ytbi6vL6/wMHBwcC/vry7ube1r6KWin90amFYUElDPjk5QEdOVVVSUU9OVl5mbnFubGpoZmRiYF9eXV1cXF1dXmBhYmRmanWAjJahqrO8w8O/vbq5v8THyszO0NHS09PT0tHQz83LxbisoJWQkI+OjY2NjI2IfnRrY2JlZmhpY1tVTkxRVVleXFdSTUlFQj87PUZNVV1eXFpYV1VUUlJVXmdweXp4d3Z1fYSLkpaTkpCNi4aHkJairbfAw8C9ubS2u77Bw721rqael5CJgnx2cWtobXN4f4F9eXZydXuBhoqGgX14dG9rZ2NfXFlXVl1lbHV4dmxaTUI6NC4rKSgoKC06RVFdYmRmaGtucXN0eIOMlZ6gnZyamZeVk5GPjoyLio+Yoamwr6yqqLLE0t7o7/Py8O7s6OXi39zZ19TSyr60qZ6UioF4cGhiW1VRTEhEQkA9PDs6Ojo6QUtVX2hxen94b2JYUEpFQDw4NTMwLy4yPEZRW19fYGBhYWJiYmNkZWZnbnmEjpehqbG5wMfN0dbTzMW+t73M1t/i3djRy8O8tKylnZaPiIWIjI+TkYqEfnl8gIOHiIF7dW9pY15YVFlgZ25xbGdiXV5jZ2xkUkM3LCYpLTE3NzMyMC8uLi4uLzAyNDY+S1dkcXyHkZyioJ+dmp6lq7G3tK+rpqSprrK3u8DQ3efu8vTz8e/p3tPOzsvKyMbDwb+5rKCTiH50a2NaUUlBOjQuKiYjJi42PkZOVl1lbHJ4fYN7ZVVHOzk7PUBESE5UWmBla3F2e4CEiYyQk5aZlY2FfXd4e32Ag4eKjZCSlZeZm5SMhHx1bmdqcHN1dnZ2foePmaCem5iTlJmdoaWprK+xtLW3uLm6ubm4t62imI2FhYWFhYaGh4iIiouMjYt/aFNBMSQaEQsHBQUEBAsUHys3Q09aZWdoaGhoaWhpaWlqa2xtb3BydHiDjZehpqepq6yzvMLL3ev0+Pz9+vj18vLx7+3q5+Th3tvY1dPQzsvAs6eckYd9dWxkXlhZXWBkZ2tvc3d2cGtmYVtXTDgqHxYPCgsRGCApMjtFTlVWVlZWVlZWV1deZ294f4CBgoGAfnx6eHZ1dHN0fISLk5uiqK60u8LHycnIxsPAwMXIzM7Kw723srS1tre0rKSdlo6HgHp0bmllYGBlam90eX2ChoiDfXhzbmhkXUo5LSMaFRAODQ0QGiQwPEJFSEpNV2BpcnuDipGYnqOorLCztri6u7y8vLy0q6KZkIiAeHFrZmFdWVxiaG5ycG1raWtxeH6EiY+UmZyXk46JhIB7d3N2fICGiYaCf3t8goeLkI6KhoJ/hImQlpueoaOloJmSi4WHiYuNj5GTlJWRiYJ7dW9pY15ZVVJPTEpIR0dJUltjbHR8hIuSmZ+jqK2ws7W3ta2mnpeQiYJ8dnBrZ2NgXVpYV1ZVVVVWX2hxeYGJkZeepayyt7u9v8DAwL++vbu6uLazsKWaj4V7cmlhWVJMR0I/Q0lOVFdUUlFPTk1MS0tKS0tMTU5PUVJUV1lbX2l0fomPj5CRkZafpq20ur/EyMnDvriysrW3ubq8vb7Av7ixqJ+XjoV9dm9pZF9aVlNQTlJaYGhudXyCiIqGg398foKGi46KhoJ+fIGFiY2LhoF9eXRwbGhpb3R5f356eHVzeH2DiIqGgn57fYKGi4+Tl5qeoKKkpqeoqKqrrKyrqaehlYqAdXFwb29vb29wcG5lXldQT1JUV1hTTkpFQ0hNUlddYmdsb2xoY2BcWFVST01LSklISEhJSktNT1FTVllcX2JlaGxvdYGMl6Krtb7GzMrHxcHBx87S1tTNxr+5uru9vr/BwsPDxMTDw8LBwL69uK2jmY6KiomIh4B3cGllaGlsb2xmYVtXUk5LR0dNU1lgYV5cWllfZWtxdHFubGlscnd8gH57eHVyb21qaGtxdn2Dg4KBfn6Dh4uPk5aanZ+blpGMh4J9eXVxbmtoZmtxd32Afnx6eHuCiI2SkI6LiIiNkZaamZWSjouOkpWZmpaRjYmJjZCTlpmcn6Ghm5WPiYN9eHNvcXV4fH14dXNxb2xpZWFeW1hWVl1jaW9xb25sa2loZ2ZlZGRkZGRkZWVmbXZ+ho6WnaOqr7S4vL66ta+po52Yko2Ig397d3Rxb2xsc3h+hIWDgX99e3l3dXV8gYeMkpabn6KgnZqWlJaYmZqXkIqDfXhybWhmam1xdXl9gYSHg356dXJ1eHt9gIOGiYuNj5CSkYqDfHVvaGNdWVpeYWVpbXB0d3t+gIOFh4mKjI2Njo6Ojo6NjIuEfHNqZWVlZmhrbXBycnNzc3NyamJbVU5JQz87PkNITVFOTEpJTFNZYGZscnh+gn9+e3l2dHJwbnN6f4aKiIeFhIaNkpidnJqXlJSZnqOnrLC0t7q9wMLDxMXGxsbFxcTCwb+9vLy5sKabkYd9dGxkZGVnaWlkX1tXV1xhZWlnZGFeXmNobXN0cW5samlnZWRka3F4foWLkJabmZaTj42RlZmdnJeTj4uNkZSYmZWQjIeHi46SlZKOioWBfXl1cm9tbWxscHZ7gIOBfnx5d3RycW9zen+Fi5CWmp+fm5eSj5CUl5qblpGMiYSAfHh0d3yAhYiFgX57fICFiY2RlZibnJeSjIeCfXhzb2tnZGBfZWpvdXp/hImNi4aCf3x6d3RwbGhkYV5hZ2txdnuAhYmNkZSXmpyen6CgmZGKgn+AgIGCg4WGh4mJiouLiIB5cWpqa2xubmhiXVhTT0tHREE/PTw9REtSWmFob3Z8goeMkZOQjIeCfnl1c3FvbWpnZGFfXVteZmxzent6eXh5f4WLkpSSkI6LiYeFg4KIjZOZnJqYlZOWnKGmqq2wsrS2t7i5ubq5ubi2r6egmJGKg314cm5pZWNmam5ydnp+gYWDgHx5dnp/g4iIhIB7d3Jua2dkYV9dW11jaG1zdHJxcXBvbm1sbGxsa2tsbG1ucHFyc3V2eHl7fH5/gYKFjJSboqalpaWjp6ywtbi8v8LEw765s66po56ZlI+LhoKBhIeJjZKWmp2emJKNh4OEhYaGg314cm1pZWBcWVZTUU9SV1xhZWVjYmBhZ21yd3d1c3FvbmxqaGlvdHh9fXt5eHZ0cnFvbmxra2pudHl/hYqPk5iZlpOQjYqGg4B8end2dXV0c3FvbWxraWloaGhnaGhpampwd36FjJKYnaKkop+dmpueoKOmqautrrCwsbGxsbGwr62lnZWOiIiHhoaCenVuaWNeWlZUV1teYmVpbHBzdnl8fn55dHBra25xdXh1cGtmYl1YVVJTV1tfY2dscHR2c3Bua2xwdHh7f4KGiIuOkJOVl5mam5yWkIuFgHp1cW1pZmNgX2NobXJ1c3JxcG9vbm1tbW1tbXB3fYSLkZedoqerr7K2t7WyrqmknpiTj4+Rk5WVkY2JhYaJjI+RjoqHhIB9end1c3Fvbmxsa2xrbnV7goiKiomJiI2Sl5yhpamsr66qpaGcmJSPi4iEgH56fICEiIyKh4SCgH57eXZ0cnFxcXd+g4iKh4SBfoCDh4qNioeEgH+ChYiLioaDf3t4dXJvbGpnZmRjY2JiYmJiYmNlbXR7gYeNk5icm5iWk5CNioeEhYmMkJKQjYqGg4B9enh1c3FvbmxramloaGprbHF4fYKGhoSCgH58enl3eX6DiIyQlJibnZmVkY2JhYF9enx/goWJjI+SlJOOioaCg4WHiIqMjY+RjoiDfXhzbmllYmVoa25uamhlYl9dW1lZXmNobXF2en6Ch4uQlJaXmJiXl5aWlZSNhn54cWpkX1lYW15gY2VnaWtsaWViX19iZmlsb3N1eHt+gIKFh4iKi4yJhYF9enx9f4GAfHl2c3V4en1/fHp4dnRycW9ubm1sbG1yd36FiYmKiYiKjpKVl5WTkY+Qk5aZnJ+ipKaoqqytrqynop2ZmJmam5qWko6KiYuNjpCOioaDgYSFh4qMjpCSk5CMiYWBfnp3dHR3eXx/fnt5d3VzcXBubGtqaWloaGprbG5vbm5ubm1ubnN4foOHh4eGhoiNkZWYmJaUkpCNi4mHhYOCgYCDiIyQk5KQj42LioiHhYiLj5KVmJueoKKkpaanp6enpqalpKOhn56cmpiWk5GPjYqHhYN/eXNtZ2BZUkxHR0hJS0pGQ0E/PTs6OTg3Nzg4O0JITlRbYGZrcXV6f4OHio2QkpGNioaDgHx5dnZ5e36ChIeKjI6LiYWCgoWHiYuOj5GTlJCMiYWDhoeJioiEgH19gIOGiIeDf3t3eHp8fn98eXZ0c3d5fH9+e3l3dXh7f4KFiIqNj5KVl5manJ2en52Yk46JhYF8eXZ3enx+gYOFiIqMjpCRko6KhoJ+enZzcHF0d3p8end1c3Fvb29vb29tbGppaGdnZ2doaGlqa2xtb3Byc3V2eHp8fX+BgoSGh4iKjI6PkZKUmJ+lqq+0ub3Aw8XIycrLy8vLycK8tq+oopyWkIuGgX15dXJvbWpoZmVjYmFgYGBgYmNkZ21ydnp6eXd2dHNycG9wdHh8f4OGiYyOjImGgoGDhYeIhoN/fXt8foCCgn98eHVyb21qaWtvcnV2dHJwbm1raWhmZWVkY2NjYmJjY2RkZWZscnh9gYGAgIGDhISDgoWIi4+QjYuJhoiLjpCSkI2KiIWCgH17eXd2dHJxcG9vb29wcHB0en+Fio+TmJyfo6Wnqaikn5uXk4+Lh4SAfXp4dXNxb25ydnp+gX9+fHt9gYSHiYiFhIOEiIuNj5CRkpKRjYiDf3p2cm9ra2xtb3FydHZ4eHVzcW5vcXN1d3Z0c3Fxc3Z4e32AgoSGiIqLjYyJhoOAfnt4dnR1eHp8fXt6eHd1dHNycXBwcG9vb29vcHN6gIWKiomIhoaJi46RkI+Ni4qIhoWDg4aJjI6PjYyKiYeGhIOCgYCAgH+Af39/f4CAgIGGio6Slpmdn6Kkp6ipqqusq6yrq6qpqKOemJOOiYSAfHp7e3x8eXZzcG9ydXd5e3t8fHx4dHFta2xtbm9wcXJzdHV2d3h4dHFua2prbG5ubWtpZ2VkYmFgYWVobG9vbm5tbXF1eHt8e3p5eHh3dnV1dHR0dHZ6foKGio2RlJaUkpGOj5GUl5udn6Cgn5+enp2alZGMiIeHh4eGgn97eHVyb21rbW9xdHd5e36Ag4WHiYuMjY6PkJCRkZKPi4eDf3t4dXFubGpoZmdqbXBzc3JxcHB0d3p9gIOGiIuNjpCRkpOVl5mampqZl5aUkpGOiIN+eXRwbGhkYV9dW1pdYGNmaW1wc3Z1dHRzcnJxcHBvb29vb29wcHFyd3yAhYeHh4eHh4eHh4iLj5OWl5aWlJOSkZCPjpGUl5mcnqCipKiqrK2sq6qpp6SemJOOiYR/e3h4eXp6enZ0cW5samhmZmlrbnFycXFwb3F1eHt9fHt5eHl8foGEhoiKjI2PkJGSkY2KhoOCg4SEhYaGh4eIiImJiYmJiIiHhoWFhoeHh4aEgoB+fHp0bmlkX1tXVFFRU1VXWVxeYGNmaGptb3FzdHZ4enx+f4CBgoOEgX57d3V2d3l6e31+gIF/fHp3dXNxb21samppaWhoaWlqamtsbXF2e4CFh4iLjY+Tlpibm5mXlpSSkI+NjIuKiYiJjI+TlpaVlJKRkI+OjYyKioqKjJCUl5qdoaOlpaOhnpydnp+goaKjo6OinpqWko6Kh4OAfXp4dXV3eXx+gIKDhIWCgH17eXh3dnV1dnd3d3VycG1tbnBxc3R2d3l6d3VzcW9ta2poaWxucHJ1d3p9fnx7eXh2dXNycnR2eXx9e3p5eHp8f4GDhYeJi4yOj5CRj4yJhoOAfnt5d3VzcW9xc3Z6foKFhoiHhIF+fHl3dXNxb25tbGxvcnV4eHd3dnZ1dXR0dHRzc3R0dXZ3d3h5ent7fH1+f4OHi4+Sk5KTkpOWmZudoKKjpaajoJ6bmpqbm5uZlpOQjYqGhIF/gYOGiIiGhIF9end1cnBubGppam1vcnR3eXx+f317enh5e31+gH58enl5e31/gYOFhoiJh4SCgH+AgYKDgn99e3l3dXNxcXR2eHp9f4GDhYaIiYqKh4WCf3+AgIGDhYiJi4qFgX16eHh4eXl5ent7enh1cm9vcXJzdXZ3eXp6eHVzcXF0dXd5eHZ1c3N1eHp8fHt5eHd2dXV0dHd6fYCDhoiLjYyKiYeGhIOCgIGEhomLjY+RkpSVlpianJ6fn56alZCMiIiHhoaGhoWFhYJ+e3h2d3d4eXh1c3FvbWxqaWltcHN2d3Z2dXV4e36BhIaJi42Ni4qIh4iKi42Ni4mHhYOCgH59fHp5eXh3d3d3eXx/goWJjZGWmJeUko+MiYaEgoOEhoeJioyNjpCQkZKTk5OTk5KOioeDf3x5d3R1d3h6e3l3dXR0dnl6fHt5eHZ1dHNycHJ0d3p8f4GEhoiKi4yOj5CQkZGRkZGRkJCPjo2Njo6OjoyKiIaEgoB+fHhzbmplYV5bV1ZXWVtdXVtaWVlbXmFkZmZmZmZmZmZnZ2hoaWprcHR5fX9/gICBhIiLjpKUl5qcnJqYl5WWl5mam5iWk5GPjYuJh4iJi46SlZiZmZiUkI2JiYqKioqHhIJ+foCBgoOEhYaHh4WCf319fn+AgIB+fXt6fH1+gIB+fXx6eXh3dXV1dHNzdHd5fH1+fX19fXx8fHt7e3t6e31+gIGDhIaHiImLjI+QkI+Ni4mJiIeHh4eHh4aGhoaFhIOAgH58enl4dnd4eXl6e3x9foCAgYKDgoCAf359fHt6enx9fn9/fn1xdXp+gICAgICCg4OCgYOGiIuMiYeGg4WHiouNi4mHhYOAgH99fHp5eHZ1dXR0dHR1dXV4fYCDh4uOkpWXmpudn56bl5SRjouHhIKAf317eXd1dHN2eX2AgICAfn1/gIKEhoWDgoGChYeJi4uMjYyLiYWBgH15dnVxcXJzdXV2eHl7e3l3dnR1dnd5enl4d3Z2d3l7fX+AgIKDhYeHiIiGg4GAgH17eXl5e31+f319e3p5eXh3dnV1dXV1dXV1dXh9gIOHh4aFg4OGh4mLi4qIh4aFg4OBgYOGh4mKiIeGhYSDgoGAgICAgICAgICAgICAgICDhomLj5CTlJeYmpubnJydnJ2cnJybm5eTj4yJhYKAfn19fX5+fXp4dnV4eXt9fX1+fn58eXd1c3R1dXV2d3h5eXl6e3x8eXd1c3JzdHV1dXNxcW9ubW1sbW9xdHZ2dXV1dXd5fH1+fX19fHx7enp6eXl5eXp9gICDhoeKjI2Mi4qIiYqMjpCSk5OTk5OSkpGPjIqHhIODg4ODgIB+fHp5dnV0dXZ4eXt9foCAgYKDhYaHh4eIiYmKioqIhoOBgH58enh2dXRycXF0dXd5eXl4d3d5fH1/gIGDhIaHh4mJiouLjY6Pj4+OjYyLiomHg4GAfXp4dXNxb21ta2ttbnBydHZ4eXt6enp5eXl5eHh3d3d3d3d4eHl5fH+AgoODg4ODg4ODg4OFh4qLjIuLi4qJiIiHh4iLjI2PkJGSk5aXl5iXl5aWlJOPjIqHhIGAfn19fX19fXx6eXd2dXRzc3V1d3l5eXl5eHl7fX5/f359fX1/gICBg4OEhYaHh4iIiIaEgoCAgIGBgoKCg4ODg4ODg4ODg4ODgoKCgoODg4KBgICAf357eHVzcG5samlpamttbW9wcXJ0dXZ4eXl6e3x9fn+AgICAgICBgIB+fXx8fX1+foCAgICAf359fHt5eXh3dnZ1dXV1dnZ2dnd3eHl8foCCg4OEhYaIiYuLi4uKiYiHh4aFhYSDg4ODhIaIiYmJiIeHh4aGhYSDg4ODhIeIiouMjo+QkI+OjYuMjY2Njo+Pj4+PjIuJh4WDgoGAf318enp8fX5/gIGBgoKBgH9+fXx8e3t7e3x8fHt5eHZ2d3h4eXp7fH19fHt6eXd2dXV0dHZ3eHl7fH1/f35+fXx7e3p5eXp7fX5/fn19fH1+gICBgoOEhYaHh4iIh4aEg4GAf359fHt6eXh5ent9gICCgoODgYCAf318e3p5eHh3d3d4ent9fXx8fHx7e3t7e3t6ent7e3x8fH19fn5+f3+AgIGDhYaIiIiIiIiKi4yNjo+QkZGQjo2Mi4uMjIyLiYiHhYSCgYCAgIGCg4OCgYB/fn18enl5eHd2d3h5ent9fX+AgH9+fn19fn+AgIB/fn5+fn+AgIGCgoODgoGAgICAgICBgIB/fn59fHt6enx8fX5/gICBgoKDg4SEgoKAgICAgICBgYODhIOBgH9+fX19fn5+fn9/fn18e3p6e3t8fH19fn5+fXx8e3t8fH1+fn18fHx8fn5/f39+fn19fX18fH1+f4CBgoKDhISDg4KCgYGAgICBgoODhIWFhoeHh4iIiYqKioqIh4WEgoKCgoKBgYGBgYCAf359fn5+fn59fHx7enp5eXl6e3x9fn19fX1+f4CAgYGCg4SEg4OCgoKDg4SEg4KCgYCAgICAf39+fn5+fn5+fn+AgIGCg4SGhoaFhYSDgoGBgICBgYGCgoODg4SEhIWFhYWFhYWDgoGAgH9/fn1+fn5/f39+fn19fn9/f39/fn5+fX19fH19fn9/gICBgYKCgoODg4SEhISEhISEhIODg4ODg4ODg4KCgYGAgICAgH9+fHt6eXl4d3d3eHh4eHh4eHh4eXp6e3t7e3t7e3t7e3t7e3x8fX5/gICAgICAgIGCgoOEhIWFhYWEhISEhIWFhYSEg4ODgoKBgYGBgoKDg4SEhISDg4KBgYGBgYGBgICAgICAgICAgIGBgYCAgICAgICAgICAgH9/f4CAgICAgIB/f39/fn5+fn5+fn9/gICAgICAgICAgH9/f39/f4CAgICAgIGBgYGBgoKCgoKCgoGBgYGBgYGBgYGBgYGAgICAgICAf39/f39/f3+AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIB/enp6eQ==',
  bangSmall:
    'data:audio/wav;base64,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SEE7Nj5HUFljZmBcV1NPS0dFUFtmcXyHkpukrbW8wse+tKqglZGXm6Ckqa2ytKuflYp/e4CFi5GYk4mBhIiNkJWTiH50a2JZUkxSWl9ZVFBMSERCPz48PUlXYWFgZ3WDiIaFjpuko5+cmJSWoau0vcbO1dzi6Onf1M/S1c/Ct6uglYuBeHBoZm52d3BrZmFdWVVXZHF3dHBsaWZtd4F+end0cHJ9iIqFgn56eIGLlJ6nr7e/xcvQ1djb0cS7vL66rJ6anJ2Uh31+gYF2a2ZpbWleVk1FPjcxLjU+QT05PEdQWWJqZ2JgaHBzbGdiXVlWU1FYYWZiXVlWUlZhamtnZGJfX2l0end0eIOMjYiGjZaepq20u8LAuLCxtrixp6Ckp6utsa2jmZicnZWKg4eKjpGUmJuel4yCeG5nam5uZV1cYWdkW1VPSUM/Oz5IU1ZQTkpHREI/P0pWYWx3gYuVlZCMkpqhp62zuL27sKeelIyOk5ecoKSorK+yta6jmZmcm5GFf4KFgnduZV1WWV9la3J4foSDe3RsZV5XUU1VXGRsdHuCioiDf4SLkJWZmZCGg4iMh311bWVdV1BLRkI+PDpATVhjb3qFj5WRjY+ZoaCalZqipqCalI6Ign14c29saWZkY2FhYWFhYmNkZmh1g4+RkpejsLazsrjDy9Tc4unu8fHv7ern5OHe29jW09DOzMi/u7apmIiDgn5xY1ZKPzUrIyMqMDY9RU1UW2JpbnR5foKFfnNpX1VPU1dWTEU+NzErJiQsNj9JU1dTUE1KSEVDQkxYX11bX2t2gIqVoKqyusDEyMzO0NLLvrKvsbGxsq+ilol+cnBzdm9lXVZOS1JZW1VQVF5mb3h/e3V0fISFf3p0b2pveH+Hj5OOiIiPlpWOiIyTmJKMhoB5eYGIiIJ9gouQjIaEi5OcpKuyuLy/w8S6rqaoqqaaj4yPkZSWmI6EenBnY2hta2JbVU5JREA9Ojc7RlFdaHN0cXB5g4qGgoONlJykq7G3vcLGyc3P0dLT09PS0c/Mvq2hn52cmpiXlZSJe29jWEs/NCkgFxceJCIdGiIsNT9IUltlZmBbVlFOVF1lbXV4cm1oY19bV1RcZnB5g4yVnaWss7m/wruxqJ+VjIR7e4GGjJKXkYqDfXdwa2VncXmBiZGZoKeus7Stpp+XkId+d3p/hImQkIiBenRtcHd+hIuSmJ6fl46OlJicoKSckouPk5OJgH6ChYmNkIl/eX2BhYiNioB4b2dgY2luc3l6cmxlX1lTTkpFQj89Oj1JVF9qdXd0c3Nyc36Hj5efoJmVj4qFipKYn6WrsLa7vsK9s6qgl4+SlpmcoJ2TioJ7dHZ8f3hya2ZgYWhwbmlmbHR7g4qNh4KCiY+VmZ6ZkIuPk5ebn5ySioF4cGlhWlROSURBPz49RVFbWldYYmxyb21raWZsd4CJkpmWkY2JhYB9eH2FjYuGhIyUmZWRkpqioZuWkYyHgn18hYyUnKOqsLa8wcO7sqmhl5SYm5aNhYeMj5OXm56in5SLgXhuZl5ZU05JQz04NDE1QElTXWVjYF5bWVZUUlBOTVZhbHeBi5Sdpayzsaqkp62vqJ+an6KlqayvsbS2t7esoJWKfnl8fYCDhYiKjI6RkIR6b2VbWV1gZGhsb3N3en17cWlhWVJKQTkyKygwNz9GT1BLSE5YYGhweH+HiIF7fIOHg3t2e4CFi5GXnKClqaylnJKJgHhwaGFbVVBMSU9ZYmFeYGt1enh2fIaQkIyJh4SBfnx6eHd2dHRzc3N1eHp8foSQnKGgn5+en6m0u7m3tbKwraqopaOhn5ydqLG7xM3V3OPq7u3q49rRx8PGyMrMzc7MysfFw8G/vbu5t7WzsqiZlJKMfW5lZWNjY2NaTkM4LiUcFBEXHR0ZFhwmLSkkIBwZFRMQFiEsNkFLSkhHRUNFUVpkbneAiI+MhoF8dnV+hYuSmJ+kqaObk4yFgoeNi4R9gIeLhoB6dG9qZmFkbXV+ho+XnqOemJadoqissayjnJ6jpZ6Xj4h/fYGFgHhxamRgZ251fIOEfXhzbmllYV1ZVlhibG9sa2lnZmZlZGRkaHWBhoWFhISEjpmhoJ6cm5ecpq+vq6iloaCosLSvq6ainaGpsLe+wry1r6igoKarqaOeoqerrrGwppyZnZ+Zj4Z9dG5xdnVtZmBZU05JREA9O0RMVFxmaWZkaXF4dnJuamdjYF1faHB4f4eOlZmUj4qEfnl0bnF4fYSJj5Wan6OnpZyVjIR9foGEiI2SlpmcnZ6Xi4F3bWVnaWhgWFZbX2Nna2ZfWVNNS1FXWFNPSkdESlNaWFVWX2hweICIjpSSjIeCfHdybW51fHx3dHqBhoN/foaNlJmgn5mUjoiFipCTjYiDfnl7hIyTm6CblY+Jg314c25qZ2x1fISMk5qhopyYko2Ii5KXnKGmqq6tpp+fo6agl5GUl5iQiIF6c3R5foOIjZGWmp2hn5eOjZCSlJaYmpyakIZ9dGpobG5xdHd6fYCFiYh/dmxjWlFJQ0ZLTUhDPjs3NDIwN0FKSUhISEdHR0hJSktVYW15hZGbpa62vsXL0NXY297g4eHh4eDe3drY1dLOwLKklYh8cGVaUUlKTlFNR0I+OjtDS1NbY2NhX11bWmJpcHZ9g4mPi4WAenVvamVlbHJzbmtweH57eHRxbmtoZmt1foePmKCnrrS6v8THy83P0dHS0tHRz87Iua2fk4eEhIN5b2ZdVFFWWlhSTUhDQEZOU09NUFtkZmJfW1dVXGRpZmNgXlxgaXJ6g4uSmaCmrK2moJmSi4V+en2DiY+Ump+kqa2wq6Obk4uGiYyQk5eUjIWFioyGfndxamhucnh9goiNkIuEfXdwamReX2VraWRiX11dZWxzeoCGjJKXm5+ZkYqDfHh9gYWJjYmCe3Vuam90eX6Eg314e4CFgHp3fIGDfXdybWhkYFxianBtamt0e4OLkpGMiIR/fYOKjYiDf3t3e4KJkJadoqippJ+gpaqlnJSVmJiRiISIi4mBenNtZ2FcWV9mbXR7fHdzdn2DiY6UmZ6jp6qsr7Gzs7S1tLKnmpKSkZGQkIh8cmddVEtDP0RITVNYVlBMR0M/Ozg2MzEwLy82Qk1YZHB8ho6Vm6CkqKWdl5CJhIeKi4R+eXRucXd8gYeMkZeYk42NkZWZnqKlqKuusLKztbGnnpudnZWMhYaIiYuNjpCSlJWWl5iZmZmamZmUiX98fHx0amNkZWdpa29zd3p8fXZsZWZnZl5XT0lDRElOU1heY2hucnd8gISCenRuaGNnbG5pZWFdWldUUllhaGdmZWRkZ3F6fXx8g4yUnKOrsbe9w8fLztDLw7y9v8DAwr61rKiqqqOZkouFgYSHhn53cWtlYFtXU1FOTEtKSUlKS0xVYGprbHB6hI6XoKKfnpyamJ6lqaWinpqXk5CNkZidm5eUkY2OlpyiqK2yt7q1r6uusLO1t7OqopmRiouOj5GTlZeanZ+hmo+Fe3FpamtsbW9rYltbX2FjZmdfWVJMRUVLTlNYXGBlZ2FcV1JNTlRYXmNnY15cYWZscHV6foJ+d3FrZWJmamtlYWJnbGpmYmdtc3h/gHt2d32Bfnl1eH+Df3t6gISIi4+SlZeRioWIio2Pko+IgYGEhoB5c21nZWpwb2pmYl9dW1lZYWlubGxramlpaGlxe4SNlp6mrq+sqKShnZmVk5mfoZ2ZlpKPjImGhIKAfn17enp5e32FkJiYlpaepqmmo6WssrGsqa2ytbCqqK2wtLe6tq6oqayspJyYm52foqOlpqeglo6GfXVtZmBZVFZbX1xYVFFNTlVcY2pwdnyBfnp1cGtqb3R5fYKGioyHgHp1cG5zd3p9f4KEhX93b2hhWlRPSUVBREtRT0xKSEZIUVliaXFycG51fYKAfHyDiY+UmpiTj5KWmp6iopyVk5eZnJ+hm5OMhX53cWtrcHRzbmpmY2FnbnJubGlnZWVlZWx0e4KJj5WbnJeTjomFgHx5f4SKkJWboKWinJeRi4aBe3l/hIqPlZOOio6Tl5ugoZqUk5eal5CKi4+SlZiYkYqIi46Qk5WPh4KEhoeIiouLjYh/eHBpY2RoaGRgX2NmaWxvcXR2cGplX1pZXWFlaW5ydnl1b21xdXVwa2xxdHJta3B1en+DiIyQk5eanZ+ho6Slpqejm5KQkZCKgnt0bWlsbnJ1eHx/gn95dG9qZmJdXWNobXR7goiNkZSXmZyen6GclI2Mjo+QkZCJgn6Agn93cWxmYmVqbXF2en6Dg315dXFtaWVla3B2e4GCfnx/hYqPlJicoKCalZCLhoeLjpKVmZufnpeRjIaAgoWIi46RlJicoKKfl4+Hf3hxamZpbHBzd3ZwbGhkYWVrbWpnZ21zc3BtcXd8goiNkpebnqKkp6mrrK2urqyjmpWVlZWVlY6Ffn5/f4CBgoOEhYWGgHdxcXJzdHZ3eHl6e3x+gIKEhIOCgYB+fHt6eXh3dnR0c3JxcG9ubm1sZVxUU1RVVVZYWltdYGJdVlFTVldSTUtQVFhdYWZqbnJ3en6ChYeKiIF7fH+Bg4aHgXt4fH99d3NuamZiX11janF5gYSCgH16d3yCiI2TlpKPjImGiZCVmqClqq+wq6einZmUkI2QlZugpaqus7KtqKSfmpWRjYmFhYqQkY6LjpWan6SprrK1uLu9v8DBwsLCwb+1q6SkoqGgnpeNhn93cnJycnJzdHV1cGliW1RQUlVWUUxMUVVZXmJmam9ydnl7foCChIF5c3R1d3h6eXJraGttb3FzbmhiXFdUWVxgZGltcXRxbGdjXl1iZ2djYFxaWFxjaW90eoCHjZOYl5GLhX95dG9tcXV1cW1wdnuAhYmFgn57d3RxbnF3fYOJj5SanZmWko6KjJGVmZ6hpamsr7GvqKKblY6Ignx3cnF1ent3dHFvbHF4foSJj5SZnqKmqauusLK1t7i4trSysK2rqKWbj4V7cGlpaWVcVk9JQz86NjMxLy0sMDhBREVGR0hJSkxPWmNtdn+CgoKBgIGIj5WboKWqr66ppaGcmJOPjZGVmZygn5qWko6KhoN/fHl3dnV1dHNycG9tbG11e4KJkJacoqerr7O2uLq8vb6+vr28u7q4trSwpp2UioF5cWliXFZRTUlFQ0A/PUFJUFdeZWxzd3VzcW9tb3V6f4SHhYF+e3d0cW5wdXl+g4iOlJeUj42PkY+Ig354c29rZmNgYGZrcHV7end1c3BwdXp/hImNkZaanqGkpqagmpSOiIJ8d3h7foGEh4qNjYeCgYWHiYuOj5GRi4WChIWCe3Zwa2Zoa29ydXh7f397d3NuaWRfXF9jZGBdXmRobXJ3e4CEiIuOkZSWmJqVjoiCe3d5e3t2cm1pZWhscXV6fXp3dHFubGlna3F3fYOGhYKCiI2OioiKj5OYm6Cipqmrra+xsrKzsqukn6Chn5aNiYmIiYmIgXp0bWdkZ2loY19bV1RZXmFfXF1jaW50eXl2dXJwbmxqaGdmaXB2fYSKkJaboKWprK+ytLayq6Wel5KUlZSOiIaJi46QkpWWmJqbmpOMiYyOkJKTjYV+fn5/f3+AgIGBgoKDg4ODg4F5cW1ubm9wcGpjXmBhY2Zpa25wbWdiZGdqbG9ydHd6fH57dG9pZF9aVlJPTE1UWV9lbHF3fYKHjJCUlI+LhoJ9eXRxb25sa2lnZmRnbnR0c3JycnFxcXJycniBiIqKi5Oan56dn6assba7v8TIy87Q0dLT09TOxb27uriwp6GgoJyUjYZ/eHNtaWtvcGxoaG1xdXl9gYWIi46RkpSSi4V/e3Vwa2VfWlRQTExRVVpfZGNgX2RpbGpnaG1yd3t/hIiKhoJ9eHRwbWprcHR5foKGi4yIhIOHioiDf4GFh4J+enVxbmpnaW5zeH2Bf3x5d3Rxb2xvdXp5dnZ7gYWEhIKAfX6Dh4uPk5eanaCjopyWkIuGhomKhYB9gIODfnl1cW1wdHl+goSAfXyAgoWHioeCf4GEhIB8e36Af3p3c3BtamhlY2JgX15eXl5janF3foSKj5SYnZ2amJeUkpWXmZqcmpWQi4aCgoWHiYuNj5GTlZeUjomJi4uGgX1/gH96d3NwbGlmY2drb3R4end1c3FvcXZ6f4OFg4CAhIiHg4GDhomMj5CNiYeKjI+Rk5CLhoJ9en2Bgn98eXRwbGllYmBeXFtcYmdtcnh5d3Z1dHNycXJ4fYKIjI2KiYeFhIKAgYaLkJSYmJWSkI2Mj5OVkY6MiYaEgX99e3p4d3h+g4WEg4aMkJWanJqXlpqdnJiUlZqdmpeTlJWUjoiHiImGgHx3c3BydXh6fX+ChIaIioyNjo+PkJCQjYaAenRubnBxcnRzbWlkYFxdYGNmaWxoZWJfXF1iZWltcW9tamdlZWlub2xqbXJ2dXJydXp9fHt6eXd4fH99eXh7gIF+fH2BhYSBf4KGiYaEgX98fYKGio2RlZibn6KjnpqZm52eoKGcl5KNiIN/enl8f4KFiIWBf4KFiIuOjYmFgX16fH+BfXp3dHFvbGpoZmZnZ2hoZ2htc3V0c3JycXFwcHBwcnl/hoySk5KRj46Nkpebn6OjoJ6bmZaTkI2KiIaEgoOJjY6Li46SlpSRkZaZnaCjpqirrK2uqKKdl5GOkJCRkZKNiIJ9d3R2eXl1c3N2d3NtaWVhXmFkZ2tucXR2dHBsaWVre4WPlp2ip6qnop6Yk46Jg4CCg4SEhYF7dnFraGpsa2ZiXlpXVFFOTEpKT1RZXmNkYmFlam5ydnp+fYGFiIuOkZKUkouFf3t1cGtlX1pUUExMUVVaX2RjYF9kaWxqZ2htcnd7f4SIioaCfXh0cG1qa3B0eX6ChouMiISDh4qIg3+BhYeCfnp1cW5qZ2luc3h9gX98eXd0cW9sb3V6eXZ2e4GFhISCgH1+g4eLj5OXmp2go6KclpCLhoaJioWAfYCDg355dXFtcHR5foKEgH18gIKFh4qHgn+BhISAfHt+gH96d3NwbWpoZWNiYF9eXl5eY2pxd36Eio+UmJ2dmpiXlJKVl5manJqVkIuGgoKFh4mLjY+Rk5WXlI6JiYuLhoF9f4B/endzcGxpZmNna290eHp3dXNxb3F2en+DhYOAgISIh4OBg4aJjI+QjYmHioyPkZOQi4aCfXp9gYJ/fHl0cGxpZWJgXlxbXGJnbXJ4eXd2dXRzcnFyeH2CiIyNiomHhYSCgIGGi5CUmJiVkpCNjI+TlZGOjImGhIF/fXt6eHd4foOFhIOGjJCVmpyal5aanZyYlJWanZqXk5SVlI6Ih4iJhoB8d3NwcnV4en1/goSGiIqMjY6Pj5CQkI2GgHp0bm5wcXJ0c21pZGBcXWBjZmlsaGViX1xdYmVpbXFvbWpnZWVpbm9sam1ydnVycnV6fXx7enl3eHx/fXl4e4CBfnx9gYWEgX+ChomGhIF/fH2ChoqNkZWYm5+io56amZudnqChnJeSjYiDf3p5fH+ChYiFgX+ChYiLjo2JhYF9enx/gX16d3Rxb2xqaGZmZ2doaGdobXN1dHNycnFxcHBwcHJ5f4aMkpOSkY+OjZKXm5+jo6Cem5mWk5CNioiGhIKDiY2Oi4uOkpaUkZGWmZ2go6aoq6ytrqiinZeRjpCQkZGSjYiCfXd0dnl5dXNzdndzbWllYV5hZGdrbnF0dnRwbGlla3uFj5adoqeqp6KemJOOiYOAgoOEhIWBfn57eHZ3eXp7fXx5d3d5end1cnBvb29ub3FydHV3dXNxc3V3enx7eXd1c3Fwbm1sa2xucnZ5fHx7e36BhIODg4aJjI6Qk5WWmJqal5STk5SVlpaXl5eUkIyIhIKDhIJ/fHl3dXNwb21sa2ppam5xc3N0dXZ3en2AgoWHiYuKiIaDgX99e3t9f4B+fXt6eHd2dXV0dHh7f4OHiIeGiYyOjYyKiYeIio2MiomLjY+Rk5SRjo6QkZKTlJKOi4iFg4WGh4iJh4SBf3x5enx8e3t6eHZ2d3h5ent8fn16d3Vyb3Bxc3FvbWtpaWxucXR2eXt9fHp5d3Z1c3FxcG5wdHd6foGEh4mHhYSCgH99fHp5eHt+gYSHiYyPkZOVk5COj5GRjoqKi4uKhoSGiYuNjo6JhYF+enZzcXFzdHJwb3J0dXNxcG9ucHN2eXt+gYSEgoB/fnx7eXh7fn9+fXx7enl4d3p+gYSHi42QkY+NjpCSlJWWlJGOi4iFg4GBg4WGiImHhYOFh4qNkJKTko+Kh4aGhYF9eXZycnN1c29ucHJycW9vcnR0cnFvbW1ramtrampra21ydnd3eHyAhYiMjYyLjZCSlZeYl5SSkI2NjpCPjIqIhoSGiIqLjY6LiYmLjI2PkpWXmJmYmJeWko2IhoaFgHx4dHBtaWZmaGppZ2ZoamxraWhnZmdrb3N2eXl4d3Z1dnl8f4KFh4qMjpCRjoyJhoSBf3x6eHd1dHJxcXJ1eXyAg4aKjIuJiIuMjpGUl5qbmZSQj4+Pjo6OjY2KhYKBgYGBgYGCgoKCg4B8eXVxbm9vcXJ0dnh6e3x+f4CBfnt4dXJxc3R2eHl4dXNxb21samloZ2hscHN3en1/gYB/f4KEhIKBgoSFiIuOjYuJh4SDhISDgH5/gYF/fn1/gYOEhoiKi4yOj5CRkI2KiYqKiYaEhYaHiImKi4yNjY6MiYaHh4iIiYiFgoGCgoOEhYWGhoOAfn+AgYGCgH17e3x9end1c3Bvb29ydHZ3eHl2dHR1dnh5e31/gH58enh2dHJxcXN2dnRzc3JxcHBwcXFzd3t/goaJjY+SlZaUk5GPjY6QkZOUlpeYmJWTkI2LiouMjY6PjIqHhYKCg4SDgH58e3p6enp4d3VzcXJ0dnZ1dHNycnV4eXl4en1/f359fHx7enl5eHd3d3d7foGBgYGBgYKGiYyOkZGPj5GTlJaYl5WSkpOUlZWWlpeWko+NjY2Lh4SEhISBfXt8fHt4dnh7fHt3dXR0dHBta2hmZGJgYmRmZWRkY2JkZ2pra2pscHNycXJ1eXt6enp5eXh4d3d3eHt/gICAgH9/goWIi46Rk5WWlJKQj42Oj5CPjIyNj46MioiGhIWGh4aFhomMjY6OjImGg4B9enh2eHp6d3Z0c3JxcG9xdHZ2dXR0c3NycnJyc3N0dXl9gYSIi46RlJaYlpSTlZaWk5GQkZKTlJSVlZWRjouIhYJ/fH1+f4CBgn99fH1+gIKFhYKBgICAgICAgH9/f4B9eXZ2dnZzcG1raGZkYmNmaGptbm1sa2trbXBzc3NycnFydXh8f4KFh4qJiIeGhIOCgH9+fXx7e32Ag4aJi4qJiIiHiIqNjIuJiIeHi46SlJaXmJiWkpCPkJCMiYeEgX98ent9fn17eXh3d3l8foCCgoB/f359gIKEh4mLjY+QkZOUlZSSjo2NjoyIhYKAfX5/gIGCg4SFhoaHiIiJiYmJiYmJiIiFgH17eXd4eHZybmxsbG1tbm9vcG5raWtsbW5wcXJ0c3BubGppZ2VkY2JjY2Nmam1xdXh4eHp9gYSHioyOj4+NjIyNjYuJiYqKiYiGh4iJiouLiYiGhYSEhoaFhIOEh4qMj4+Ni4qLioiGhYWFhYOCgYKDgoF/fn19fn+Af35/gIKDhIaFhISEg4KBgYCAf4GDhISEg4ODg4WHiYuMjo+QkpKTlJWUkpCPkJCQkJCPj4+Pj46NjYuIhYKAf359e3h2c3BtbGlnZ2VkZmhpa21vbm5ubW1tbW1vcXN1eHp8fn5+fn+Bg4WGh4mKi4yNjIqIiImJh4WEhIWFg4F/fnx7enh5e3x9f4CBgoKBgICBgoOEhIKAf39/f359e3l3d3h4d3V0dXd4eXp6eXh3dnV0dHNzcnJycXN1eHh4eHt+gICAgICAgICAgICAgoSGhoaHiYuLioqLjY6QkZKTlJWVlpWTkZGRkY6Mi4uLioiFg4F+fn5+f4GBfnt6e3t6eHZ2d3h4eXp7e3x6eHh5enl3dnd4eHd2dXd4enx9fXx7fH5+fXx8e3l6fH1/gIKDhIWEgoKDhISCgYB/fn+AgX9+fX18fH5/gYKDg4GBgoSGiYuNjo6NjYyJhoSEg4ODg4F/fHp4d3d4eHZ1dXZ3d3Z1dHNycXFydHd5e31+fn1/gYOCgoKDhYaFhIODgoOFhoWEhIOCgoSGhoWFhoeJiouMi4qKi4yMjY6OjpCQj46Pjo2JhoOAfnx8fX19fX1+fn5/f3+Afnx6ent7eXd2dHNxcHBwb29vbm9xdHZ5e3x8fHx8fH6AgoSGh4mLjI2OjoyLi4yNjY6Oi4qJioqJhoWDgX9+fHt6e3t8e3x9fXx6eXp7fHp5ent8fHt6enl4d3d3eXt7e3p6enl5eXl5eXp6e3t8fA==',
};
