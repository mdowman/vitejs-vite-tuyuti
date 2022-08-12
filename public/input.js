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
    game.sfx['fire'] = new Audio('./sfx/fire.wav');
    game.sfx['thrust'] = new Audio('./sfx/thrust.wav');
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
    game.sfx['xlarge'] = new Audio('./sfx/bangLarge.wav');
    game.sfx['xmedium'] = new Audio('./sfx/bangMedium.wav');
    game.sfx['xsmall'] = new Audio('./sfx/bangSmall.wav');
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
    if (!iOS) document.querySelector('body').requestFullscreen();
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
