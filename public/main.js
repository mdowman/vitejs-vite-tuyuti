const animUtils = new (function () {
  let spareTime = 0;
  const wait = async (duration) => {
    if (spareTime > 0) {
      spareTime = spareTime - duration;
      if (spareTime >= 0) {
        return Promise.resolve(false);
      } else {
        duration += spareTime;
      }
    }
    if (duration <= 0) return Promise.resolve();
    return new Promise((res, rej) => {
      let targetTime;
      const animateStep = (timestamp) => {
        if (targetTime === undefined) targetTime = timestamp + duration;
        if (timestamp >= targetTime) {
          spareTime += timestamp - targetTime;
          return res(true);
        }
        window.requestAnimationFrame(animateStep);
      };
      window.requestAnimationFrame(animateStep);
    });
  };
  this.wait = wait;

  const animateFunction = async (method, duration = -1) => {
    let startTime, previousTimeStamp;
    let triggered = false;
    let proceed = false;
    let finished = false;
    return new Promise((res, rej) => {
      const animateStep = (timestamp) => {
        if (startTime === undefined) startTime = timestamp;
        const elapsed = timestamp - startTime;
        if (previousTimeStamp !== timestamp) {
          method(
            duration > -1 ? elapsed / duration : elapsed,
            () => {
              proceed = true;
            },
            () => {
              finished = true;
            }
          );
        }
        if (proceed && !triggered) {
          triggered = true;
          res();
        }
        if (!finished) {
          window.requestAnimationFrame(animateStep);
        } else {
          if (!triggered) {
            res();
          }
        }
      };
      window.requestAnimationFrame(animateStep);
    });
  };
  this.animateFunction = animateFunction;
})();

const stdUtils = new (function () {
  const cookie = new (function () {
    const create = (name, value, days) => {
      var expires;
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toGMTString();
      } else {
        expires = '';
      }
      document.cookie =
        name + '=' + value + expires + '; path=/; SameSite=None; Secure';
    };
    this.create = create;

    const _delete = (name) => {
      create(name, '', -9999);
    };
    this.delete = _delete;

    const get = (c_name) => {
      if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + '=');
        if (c_start != -1) {
          c_start = c_start + c_name.length + 1;
          c_end = document.cookie.indexOf(';', c_start);
          if (c_end == -1) {
            c_end = document.cookie.length;
          }
          return unescape(document.cookie.substring(c_start, c_end));
        }
      }
      return '';
    };
    this.get = get;
  })();
  this.cookie = cookie;
})();

const plotter = new (function () {
  let carret;
  let lastScrollHeight = 0;
  let autoScroll = true;
  let swallowScroll = false;

  function positionCarret(e) {
    if (carret === undefined) {
      carret = document.createElement('span');
      carret.textContent = '_';
      carret.className = 'carret';
    }
    if (carret.parentElement) carret.parentElement.removeChild(carret);
    e.parentNode.insertBefore(carret, e.nextSibling);
    let bottom = carret.getBoundingClientRect().bottom;
    let sr = document.querySelector('body > div.frame > div.piece.output');
    //srb = sr.scrollTop+sr.clientHeight
    //console.log(bottom,srb,sr.scrollTop,sr.clientHeight)
    if (sr.scrollHeight > lastScrollHeight) {
      if (autoScroll) {
        swallowScroll = true;
        if (sr.scrollHeight > sr.scrollTop + sr.clientHeight)
          sr.scrollTop = sr.scrollHeight - sr.clientHeight;
      }
    }
  }
  this.positionCarret = positionCarret;

  const ignoreNodes = ['#comment'];
  this.ignoreNodes = ignoreNodes;

  const forceElementNodes = ['select'];
  this.forceElementNodes = forceElementNodes;

  const customPlots = [];

  const addCustomPlot = (node, plotFunc) => {
    customPlots.push({ node: node, plotFunction: plotFunc });
  };
  this.addCustomPlot = addCustomPlot;

  const prepareTextPlotSpan2 = (node, text) => {
    let newSpan = node.ownerDocument.createElement('span');
    newSpan.textContent = text;
    //newSpan.className="char-untyped";
    newSpan.classList.add('plot-char');
    newSpan.classList.add('plot-pre');
    node.parentNode.insertBefore(newSpan, node);
    return newSpan;
  };

  const typeBlock2 = async (block, targetNode) => {
    let atn = targetNode.ownerDocument.createTextNode('');
    targetNode.parentNode.insertBefore(atn, targetNode.nextSibling);
    //node.parentNode.removeChild(node);
    let track = [];
    let i = 0;
    for (chr of block) {
      track[i] = {
        c: chr,
        dn: false,
      };
      let ti = i++;
      const schar = prepareTextPlotSpan2(atn, chr);
      schar.classList.remove('plot-pre');
      schar.classList.add('plot-hot');
      if (chr.trim() != '') positionCarret(schar);
      //console.log(chr);
      let didwait = await animUtils.wait(26.66666); // animateCircle({nextTime:0});120 typing 7=56kbps
      const postWait = () => {
        schar.classList.remove('plot-hot');
        const mc = schar;
        const transitionend = (ev) => {
          mc.removeEventListener('transitionend', transitionend);
          //console.log("ae",ev.target);
          // if (mc === block[0]) {
          //     const node = mc
          //     let tn=node.ownerDocument.createTextNode(node.textContent);
          //     node.parentNode.insertBefore(tn, node);
          //     node.parentNode.removeChild(node);
          //     block[0]=tn;
          // } else {
          //     const node = mc;
          //     const textNode = block[0];
          //     textNode.textContent+=node.textContent;
          //     node.parentNode.removeChild(node);
          // }
          targetNode.parentNode.removeChild(mc);
          track[ti].dn = true;
          let tc = '';
          for (let te of track) {
            if (!te.dn) break;
            tc += te.c;
          }
          targetNode.textContent = tc;
        };
        schar.addEventListener('transitionend', transitionend);
        schar.classList.add('plot-cold');
      };
      if (didwait) {
        postWait();
      } else {
        setTimeout(postWait, 0);
      }
    }
    atn.parentNode.removeChild(atn);
  };

  function preparteTextPlot(node, callback) {
    let block = [];
    let ws = '';
    const targetNode = node;
    const text = node.textContent;
    node.textContent = '';
    //const newTextNodetn=node.ownerDocument.createTextNode(node.textContent);
    //node.parentNode.insertBefore(tn, node);
    //node.parentNode.removeChild(node);
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char.trim() == '') {
        ws += char;
      } else {
        if (ws != '') {
          for (wsl of ws.split('\n')) {
            block.push(wsl); //prepareTextPlotSpan(node,wsl));
          }
          ws = '';
        }
        block.push(char); //prepareTextPlotSpan(node,char));
      }
    }
    if (ws != '') {
      for (wsl of ws.split('\n')) {
        block.push(wsl); //prepareTextPlotSpan(node,wsl));
      }
      ws = '';
    }
    //node.parentNode.removeChild(node);
    return async () => {
      //console.log ("t",block);
      await typeBlock2(block, targetNode);
    };
  }

  function prepareContainerPlot(node) {
    let displayDefault = node.style.display;
    node.style.display = 'none';
    return async () => {
      node.style.display = displayDefault;
      positionCarret(node);
    };
  }

  function prepareElementPlot(node) {
    let displayDefault = node.style.display;
    //node.style.display="none";
    node.classList.add('plot-element');
    node.classList.add('plot-pre');
    return async () => {
      //node.style.display=displayDefault;
      node.classList.remove('plot-pre');
      node.classList.add('plot-hot');
      node.classList.remove('plot-hot');
      node.classList.add('plot-cold');
    };
  }

  const generatePlotables = (plotableNodes) => {
    return plotableNodes.map((thing) => {
      let cpf = getCustomPlotFunction(thing.node);
      if (cpf) return cpf;
      if (thing.type == 'text') {
        //callback(node);
        return preparteTextPlot(thing.node);
      } else if (thing.type == 'container') {
        return prepareContainerPlot(thing.node);
      } else {
        //console.log(node.style.display);
        //thing.node.style.display="none";
        //return (thing);
        return prepareElementPlot(thing.node);
      }
    });
  };

  const getCustomPlotFunction = (node) => {
    for (cps of customPlots) {
      if (cps.node === node) {
        return cps.plotFunction;
      }
    }
    return undefined;
  };

  const hasCustomPlotFunction = (node) => {
    return getCustomPlotFunction(node) !== undefined;
  };

  const eachPlotable = (rootNode, callback) => {
    cn = [];
    if (ignoreNodes.indexOf(rootNode.nodeName.toLowerCase()) > -1) return;
    if (hasCustomPlotFunction(rootNode))
      return callback({ node: rootNode, type: 'unknown' });
    if (!rootNode.childNodes)
      return callback({ node: rootNode, type: 'unknown' });
    if (forceElementNodes.indexOf(rootNode.nodeName.toLowerCase()) > -1)
      return callback({ node: rootNode, type: 'element' });
    if (rootNode.childNodes.length == 0)
      return callback({ node: rootNode, type: 'element' });
    rootNode.childNodes.forEach((e) => cn.push(e));
    callback({ node: rootNode, type: 'container' });
    cn.forEach((node) => {
      if (node.nodeName == '#text') {
        callback({ node: node, type: 'text' });
      } else {
        eachPlotable(node, callback);
      }
    });
  };

  const getPlotableNodes = (rootNode) => {
    const plotableNodes = [];
    eachPlotable(rootNode, (plotableNode) => {
      plotableNodes.push(plotableNode);
    });
    return plotableNodes;
  };

  const plot = async (rootElement) => {
    rootElement.addEventListener('scroll', () => {
      if (swallowScroll) {
        swallowScroll = false;
        return;
      }
      autoScroll = false;
    });
    let things = generatePlotables(
      getPlotableNodes(document.querySelector('div.output'))
    );
    for (let thing of things) {
      await thing(this);
      //console.log(thing);
      //await animateCircle({nextTime:20});
      //thing.node.style.display="";
    }
    //re=document.getElementsByClassName("piece")[0];
    //let things=[];
    //things=generatePlotables(getPlotableNodes(re));
    //console.log("plot");
  };
  this.plot = plot;
})();

const customMouse = new (function () {
  let outputLayer, mouseLayer, mouseElement;
  let initialised = false;

  let mouseCursor = 'normal';
  let mouseBusy = 0;
  let cmEnabled = false;

  const initialise = () => {
    if (initialised) return;
    outputLayer = document.querySelector('div.output');
    mouseLayer = document.querySelector('div.mouseLayer');
    mouseElement = document.querySelector('div.mouse');
    window.addEventListener('mousemove', (e) => {
      if (e.sourceCapabilities.firesTouchEvents) return;
      const bounds = mouseLayer.getBoundingClientRect();
      let mx = e.clientX - bounds.left;
      let my = e.clientY - bounds.top;
      mouseElement.style.left = `${mx}px`;
      mouseElement.style.top = `${my}px`;
      if (outputLayer.scrollHeight > outputLayer.clientHeight) {
        if (mx >= bounds.width - 24) {
          return disable();
        }
      }
      enable();
    });
    setTagsHover('button', 'link_select');
    setTagsHover('a', 'link_select');
    setTagsHover('input', 'text_select');
    setTagsHover('textarea', 'text_select');
    initialised = true;
  };
  this.initialise = initialise;

  const setBusy = (bv = 0) => {
    mouseBusy = bv;
    if (bv > 0) mouseElement.setAttribute('class', 'mouse busy');
    if (bv == 0) setCursor(mouseCursor);
  };
  this.setBusy = setBusy;

  const setCursor = (name) => {
    mouseCursor = name;
    if (mouseBusy == 0)
      mouseElement.setAttribute('class', 'mouse ' + mouseCursor);
  };
  this.setCursor = setCursor;

  const enable = () => {
    if (cmEnabled) return;
    outputLayer.style.cursor = 'none';
    mouseElement.style.display = '';
    cmEnabled = true;
  };
  this.enable = enable;

  const disable = () => {
    if (!cmEnabled) return;
    outputLayer.style.cursor = 'unset';
    mouseElement.style.display = 'none';
    cmEnabled = false;
  };
  this.disable = disable;

  const setElementsHover = (elements, cursorName) => {
    for (let e of elements) {
      e.addEventListener('mouseenter', () => {
        setCursor(cursorName);
      });
      e.addEventListener('mouseleave', () => {
        setCursor('normal');
      });
    }
  };
  this.setElementsHover = setElementsHover;

  const setTagsHover = (tagName, cursorName) => {
    setElementsHover(document.getElementsByTagName(tagName), cursorName);
  };
  this.setTagsHover = setTagsHover;
})();

function setupSecretCodes() {
  document.getElementById('btnSubmit').addEventListener('click', (e) => {
    let txt = document.getElementById('message').value.toLowerCase().trim();
    let unlock = false;
    if (txt == 'uuddlrlrba') unlock = true;
    txt = txt.replace(/(?:\W+|^)(\w)\w*/gm, (s, s2) => {
      return s2;
    });
    if (txt == 'uuddlrlrba') unlock = true;
    if (unlock) {
      e.preventDefault();
      addOSC();
      game.debug = false;
      game.initialise();
    }
  });
  setupInputs();
}

function isReturningUser() {
  if (stdUtils.cookie.get('returningUser') == 'yes') {
    //quick color grade
    for (let pth of document.querySelectorAll('#logo path')) {
      if (pth.style.fill == 'rgb(255, 255, 255)') {
        pth.style.fill = '#14fdce';
      }
    }
    return true;
  }
  stdUtils.cookie.create('returningUser', 'yes');
  return false;
}

function setupCookieButtons() {
  document.getElementById('btn-deleteCookie').addEventListener('click', () => {
    stdUtils.cookie.delete('returningUser');
  });

  document.getElementById('btn-resetPage').addEventListener('click', () => {
    stdUtils.cookie.delete('returningUser');
    location.reload();
  });
}

function enableKickstart() {
  let shiftLeftDown = false;
  let altLeftDown = false;
  let altRightDown = false;

  window.addEventListener('keydown', (evt) => {
    if (evt.code == 'ShiftLeft') shiftLeftDown = true;
    if (evt.code == 'AltLeft') altLeftDown = true;
    if (evt.code == 'AltRight') altRightDown = true;
    if (shiftLeftDown && altLeftDown && altRightDown) {
      console.log('sreset');
      stdUtils.cookie.create('returningUser', 'no');
      location.reload();
    }
  });

  window.addEventListener('keyup', (evt) => {
    if (evt.code == 'ShiftLeft') shiftLeftDown = false;
    if (evt.code == 'AltLeft') altLeftDown = false;
    if (evt.code == 'AltRight') altRightDown = false;
  });
}

window.addEventListener('DOMContentLoaded', async (event) => {
  customMouse.initialise();

  setupSecretCodes();

  setupCookieButtons();

  enableKickstart();

  if (isReturningUser()) {
    let speed = document.getElementById('speedInfo');
    speed.parentElement.removeChild(speed);
    return;
  }

  //Page drawing animation...
  customMouse.setBusy(1);
  let logoElement = document.getElementById('logo');
  plotter.addCustomPlot(logoElement, makeSvgPlotter(logoElement, 5000));
  document
    .querySelectorAll('svg.social')
    .forEach((e) => plotter.addCustomPlot(e, makeSvgPlotter(e, 1000)));
  await plotter.plot(document.querySelector('div.output'));
  customMouse.setBusy(0);
});
