const { animate, createAnimatable, utils, eases } = anime;

function connect() {
  const ws = new WebSocket(
    `ws${globalConfig.webSocketAddress != "localhost" ? "s" : ""}://${globalConfig.webSocketAddress}:${globalConfig.webSocketPort}`,
  );
  eventLog.addItem("CONNECTING...");
  ws.onopen = onOpen;
  ws.onclose = onClose;
  ws.onerror = onError;
  ws.onmessage = onMessage;
  return ws;
}

function onOpen() {
  eventLog.addItem("CONNECTED", "#8cf", 10);
}

function onClose() {
  eventLog.addItem("DISCONNECTED");
  setTimeout(() => {
    eventLog.queue = [];
    connect();
  }, 10000);
}

function onError() {
  eventLog.addItem("FAILED TO CONNECT");
}

function onMessage(e) {
  const event = JSON.parse(e.data);

  switch (event.type || event.event) {
    case "hello":
      console.log(event);
      handlePluginVersion(event.status);
      return;
    case "sceneEvent":
      handleSceneEvent(event.status);
      return;
    case "TNHScoreEvent":
      handleScoreEvent(event.status);
      break;
    case "TNHTokenEvent":
      handleTokenEvent(event.status);
      break;
    case "TNHPhaseEvent":
      handlePhaseEvent(event.status);
      break;
    case "TNHHoldPhaseEvent":
      handleHoldPhaseEvent(event.status);
      break;
    case "TNHLostStealthBonus":
      eventLog.addItem("STEALTH BONUS LOST", "#f46");
      break;
    case "TNHLostNoHitBonus":
      eventLog.addItem("NO HIT BONUS LOST", "#f46");
      break;
    case "healthEvent":
      if (event.status.health <= 0) healthBar.setHealth(0);
      else healthBar.setHealth(event.status.health / event.status.maxHealth);
      break;
    case "buffEvent":
      handlePlayerBuff(event.status);
      break;
    case "ammoEvent":
      handleAmmoEvent(event.status);
      break;
    default:
      console.log(event);
      break;
  }
}

function compareVersions(a, b) {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function handlePluginVersion(event) {
  const minSupportedVersion = "0.2.0";
  if (compareVersions(event.version, minSupportedVersion) < 0) {
    console.error(
      "Unsupported mod version detected, please update H3Status\n",
      `Current: ${event.version} Required: ${minSupportedVersion}+`,
    );
    eventLog.addItem("UNSUPPORTED MOD VERSION", "#f66", 30);
    eventLog.addItem("PLEASE UPDATE H3STATUS", "#f66", 30);
    // setTimeout(
    //   () => clearInterval(eventLog.queueHandler),
    //   globalConfig.eventLogDelay * 1000 * 4,
    // );
  }
}

function handleSceneEvent(event) {
  scoreCounter.setValue(0);
  healthBar.setHealth(1);
  utils.$(".weapon-name")[0].textContent = "NO WEAPON";
  ammoCounter.update({ weapon: "", capacity: 0 });
  currentWeaponName = "";
  currentPhaseIndex = 0;
  currentHoldPhaseIndex = 0;
  levelBar.reset();
  phaseBar.reset();

  if (
    globalConfig.showScorePanel &&
    [
      "TakeAndHold_Lobby_2",
      "TakeAndHoldClassic",
      "TakeAndHold_WinterWasteland",
      "Institution",
      "TakeAndHoldDark",
    ].includes(event.name)
  ) {
    utils.set("#score-panel", { display: "initial" });
  } else {
    utils.set("#score-panel", { display: "none" });
  }
}

let currentPhaseIndex = 0;
function handlePhaseEvent(event) {
  if (!globalConfig.showLevelBar) return;
  if (event.count < 5) levelBar.setLength(event.count * 2);

  switch (event.phase) {
    case "Take": {
      phaseBar.reset();
      currentPhaseIndex = event.level * 2;
      levelBar.setColor(currentPhaseIndex, "#0ff");
      if (event.level > 0) {
        for (let i = 0; i <= currentPhaseIndex - 1; i++) {
          levelBar.setColor(i, "#0f4");
        }
      } else {
        eventLog.addItem(
          `SEED: ${event.seed} - HOLDS: ${event.count > 99 ? "ENDLESS" : event.count}`,
          "#8cf",
          10,
        );
      }
      if (event.holdName) {
        eventLog.addItem(`NEXT TARGET: ${event.holdName}`, "#8cf", 10);
        // eventLog.addItem(`RESUPPLY AT: ${event.supplyNames[0]}`, "#8cf", 10);
      }
      if (event.count < 99) {
        const holdsRemaining = event.count - event.level;
        eventLog.addItem(
          `${holdsRemaining} HOLD${holdsRemaining > 1 ? "S" : ""} REMAINING`,
          "#8cf",
          10,
        );
      }
      break;
    }
    case "Hold": {
      currentPhaseIndex = event.level * 2 + 1;
      levelBar.setColor(currentPhaseIndex, "#f80");
      levelBar.setColor(currentPhaseIndex - 1, "#0f4");
      break;
    }
    case "Completed": {
      for (let i = 0; i <= currentPhaseIndex; i++) {
        levelBar.setColor(i, "#0f4");
      }
      break;
    }
    case "Dead": {
      levelBar.setColor(currentPhaseIndex, "#f04");
      phaseBar.setColor(currentHoldPhaseIndex, "#f04");
      break;
    }
  }
}

let currentHoldPhaseIndex = 0;
function handleHoldPhaseEvent(event) {
  if (!globalConfig.showPhaseBar) return;
  phaseBar.setLength(event.count);

  currentHoldPhaseIndex = event.level;

  if (event.phase == "Analyzing") {
    phaseBar.setColor(currentHoldPhaseIndex, "#fc0");
  } else if (event.phase == "Hacking") {
    phaseBar.setColor(currentHoldPhaseIndex, "#f80");
  } else {
    phaseBar.setColor(currentHoldPhaseIndex - 1, "#0ff");
  }

  if (currentHoldPhaseIndex > 0) {
    phaseBar.setColor(currentHoldPhaseIndex - 1, "#0f4");
  }
}

function handlePlayerBuff(event) {
  let element = "";
  let color = "";

  switch (event.type) {
    case "QuadDamage":
      element = "ammo-counter-left";
      color = "#f8f";
      eventLog.addItem(
        `BULLET BOOST (${event.duration}s)`,
        color,
        event.duration,
      );
      break;
    case "InfiniteAmmo":
      element = "ammo-counter-left";
      color = "#4f8";
      eventLog.addItem(
        `INFINITE AMMO (${event.duration}s)`,
        color,
        event.duration,
      );
      break;
    case "Regen":
      element = "health-bar";
      color = "#4f8";
      eventLog.addItem(`REGEN (${event.duration}s)`, color, event.duration);
      break;
    case "Invincibility":
      element = "health-bar";
      color = "#fc4";
      eventLog.addItem(`SHIELD (${event.duration}s)`, color, event.duration);
      break;
    case "Ghosted":
      element = "health-bar";
      color = "#8cf";
      eventLog.addItem(`GHOST (${event.duration}s)`, color, event.duration);
      break;
    case "MuscleMeat":
      element = "score-panel";
      color = "#f84";
      eventLog.addItem(
        `MUSCLEMEAT (${event.duration}s)`,
        color,
        event.duration,
      );
      break;
    case "Cyclops":
      element = "score-panel";
      color = "#f66";
      eventLog.addItem(`CYCLOPS (${event.duration}s)`, color, event.duration);
      break;
    case "Health":
      return;
    default:
      eventLog.addItem(`${event.type} (${event.duration}s)`);
      return;
  }

  const anim = setInterval(() => {
    for (let i = 0; i < 2; i++) {
      const target = document.getElementById(element).getBoundingClientRect();
      const particle = document.createElement("div");
      particle.className = "arrow-particle";
      particle.style.backgroundColor = color;
      document.getElementById("overlay").append(particle);
      const source = particle.getBoundingClientRect();

      utils.set(particle, {
        x: utils.random(target.left - source.left, target.right - source.width),
        y: utils.random(
          target.bottom - source.bottom + source.height,
          target.top - window.innerHeight + source.height,
        ),
      });

      animate(particle, {
        y: "-=" + 20 * utils.get(":root", "--scale", false) + "px",
        opacity: [0.8, 0],
        duration: 1000,
        onComplete: () => {
          particle.remove();
        },
      });
    }
  }, 100);

  setTimeout(() => {
    clearInterval(anim);
  }, event.duration * 1000);
}

function handleScoreEvent(event) {
  if (globalConfig.showScoreCounter && event.score > scoreCounter.value) {
    scoreCounter.setValue(event.score);
  }
  if (globalConfig.showEventLog) {
    eventLog.addItem(`${event.value * event.mult}: ${getEventString(event)}`);
  }
}

function handleTokenEvent(event) {
  const words = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE"];
  if (event.change <= 0) return;
  if (event.change > 1) {
    eventLog.addItem(
      `${words[event.change] || event.change} TOKENS FOUND (${event.tokens})`,
      "#8cf",
    );
  } else {
    eventLog.addItem(`OVERRIDE TOKEN FOUND (${event.tokens})`, "#8cf");
  }
}

let currentWeaponName = "";
function handleAmmoEvent(event) {
  if (globalConfig.showWeaponName && event.weapon != currentWeaponName) {
    document.getElementById("weapon-left").textContent =
      event.weapon.toUpperCase();
    currentWeaponName = event.weapon;
  }
  if (globalConfig.showAmmoCounter) {
    ammoCounter.update(event);
  }
}

function getEventString(event) {
  switch (event.type) {
    case "HoldPhaseComplete":
      return "HOLD COMPLETED";
    case "HoldDecisecondsRemaining":
      return `TIME BONUS (${Math.floor(event.value / 10 / 5)}s)`;
    case "HoldWaveCompleteNoDamage":
      return "HITLESS WAVE";
    case "HoldPhaseCompleteNoDamage":
      return "HITLESS HOLD";
    case "HoldKill":
      return "KILL";
    case "HoldHeadshotKill":
      return "HEADSHOT";
    case "HoldMeleeKill":
      return "MELEE";
    case "HoldJointBreak":
      return "NECK SNAP";
    case "HoldJointSever":
      return "RIP & TEAR";
    case "HoldKillDistanceBonus":
      return `LONG SHOT (${25 * Math.round(event.value / 50)}m)`;
    case "HoldKillStreakBonus":
      // return `KILL STREAK (${Math.floor(event.value / 25)})`;
      return "MULTIKILL";
    case "TakeCompleteNoDamage":
      return "HITLESS TAKE";
    case "TakeCompleteNoAlert":
    case "TakeHoldPointTakenClean":
      return "NO ALERT";
    case "TakeKillGuardUnaware":
      return "STEALTH KILL";
    default:
      console.log(event);
      return "UNKNOWN";
  }
}

class Log {
  constructor(length) {
    this.element = document.getElementById("log");
    utils.set(":root", { "--log-length": length });
    this.elements = [];
    this.queue = [];

    if (!globalConfig.showEventLog) return;

    this.queueHandler = setInterval(
      () => {
        if (!this.queue.length || document.visibilityState == "hidden") return;
        if (globalConfig.pauseEventLog) {
          if (this.elements.length >= globalConfig.eventLogLength) return;
        }

        this.animateItem(this.queue.shift());
      },
      Math.max(0.1, globalConfig.eventLogDelay) * 1000,
    );
  }

  addItem(text, color, duration) {
    this.queue.push({ text: text, color: color, duration: duration });
  }

  animateItem({ text, color, duration }) {
    const el = document.createElement("span");
    el.textContent = text;
    this.element.appendChild(el);
    this.elements.push(el);

    if (color) el.style.color = color;

    animate("#log span", {
      y: "-=" + el.clientHeight,
      duration: 250,
      ease: eases.outBack(1.5),
    });

    animate(el, {
      opacity: 0,
      delay: (duration || globalConfig.eventLogLifeTime) * 1000,
      duration: 1000,
      onComplete: () => {
        this.elements.splice(this.elements.indexOf(el), 1);
        el.remove();
      },
    });
  }
}

class CounterColumn {
  constructor() {
    this.value = 0;
    const [$template] = utils.$("#counter-column-template");
    const [$counter] = utils.$("#counter");
    this.element = $template.content.cloneNode(true).firstElementChild;
    $counter.prepend(this.element);

    this.elementAnimator = createAnimatable(this.element, {
      y: { unit: "px" },
      duration: 0,
    });

    const height =
      document.getElementsByClassName("counter-digit")[0].clientHeight;
    const maxHeight = height * 10;

    this.valueAnimator = createAnimatable(this, {
      value: 250,
      ease: eases.outBack(0.5),
      onUpdate: () =>
        this.elementAnimator.y(
          (((-height * this.value) % maxHeight) - maxHeight) % maxHeight,
        ),
    });
  }

  setValue(value) {
    this.valueAnimator.value(value);
  }
}

class Counter {
  constructor(length) {
    this.value = 0;
    this.length = length;
    this.columns = [];

    for (let i = 0; i < length; i++) {
      this.columns.push(new CounterColumn());
    }
  }

  setValue(value) {
    const digits = Math.floor(Math.log10(value)) + 1;
    if (digits > this.length) {
      for (let i = 0; i < digits - this.length; i++) {
        this.columns.push(new CounterColumn());
      }
      this.length = digits;
    }

    this.columns.forEach((e, i) => {
      e.setValue(Math.floor(value / Math.pow(10, i)));
    });
    this.value = value;
  }

  addValue(value) {
    this.setValue(this.value + value);
  }
}

class HealthBar {
  constructor() {
    this.element = document.getElementById("health-bar-inner");
    this.health = 1;

    this.healthAnimator = createAnimatable(this.element, {
      width: { unit: "%" },
      ease: eases.outBack(0.5),
      duration: 250,
    });

    this.setHealth(1);
  }

  setHealth(amount) {
    if (amount == this.health) return;

    if (amount < this.health) {
      animate(this.element, {
        backgroundColor: ["#f04", "#fff"],
        duration: 750,
      });
    } else {
      animate(this.element, {
        backgroundColor: ["#0f4", "#fff"],
        duration: 750,
      });
    }

    this.healthAnimator.width(100 * amount);
    this.health = amount;
  }
}

class ArrowBar {
  constructor(id) {
    this.element = document.getElementById(id);
    this.size = this.element.children.length;
  }

  setColor(i, color) {
    this.element.children[i].style.backgroundColor = color;
  }

  reset() {
    for (let i = 0; i < this.element.children.length; i++) {
      this.element.children[i].style.backgroundColor = "#fff4";
    }
  }

  setLength(length) {
    if (length == this.size) return;

    for (let i = 0; i < this.element.children.length; i++) {
      const e = this.element.children[i];
      if (i < length) e.style.display = "initial";
      else e.style.display = "none";
    }
    this.size = length;
  }
}

class AmmoCounter {
  constructor(id) {
    this.element = document.getElementById(id);
    this.elements = [];
    Object.assign(this, {
      weapon: "",
      roundType: "",
      roundClass: "",
      current: 0,
      spent: 0,
      capacity: 0,
    });
  }

  update(event) {
    if (
      event.weapon != this.weapon ||
      event.capacity > this.capacity ||
      event.roundType != this.roundType
    ) {
      this.elements.length = 0;
      this.element.replaceChildren();

      for (let i = 0; i < event.capacity; i++) {
        const el = document.createElement("img");
        el.className = "ammo-counter-item";
        el.src = AmmoCounter.getAmmoIcon(
          event.roundType,
          event.roundClass,
          i < event.spent,
        );
        if (i < event.spent) el.style.opacity = 0.5;
        if (i >= event.current + event.spent) el.style.opacity = 0;

        this.elements.push(el);
        this.element.appendChild(el);
      }

      Object.assign(this, event);
      return;
    }

    if (event.roundClass != this.roundClass) {
      // console.log("Updating ammo type");
      this.elements.forEach((el, i) => {
        el.src = AmmoCounter.getAmmoIcon(
          event.roundType,
          event.roundClass,
          i < event.spent,
        );
      });
      this.roundClass = event.roundClass;
    }

    // console.log(event.current, event.spent, this.current, this.spent);

    while (event.spent > this.spent) this.addSpent();

    while (event.spent < this.spent) this.removeSpent();

    while (event.current + event.spent > this.current + this.spent)
      this.addRound();

    while (event.current + event.spent < this.current + this.spent)
      this.removeRound();

    // console.log(event.current, event.spent, this.current, this.spent);
  }

  addRound() {
    if (this.current + this.spent >= this.capacity) return;
    const el = this.elements[this.current + this.spent];
    el.src = AmmoCounter.getAmmoIcon(this.roundType, this.roundClass, false);

    animate(el, {
      opacity: 1,
      x: [5, 0],
      duration: 150,
    });
    this.current++;
  }

  removeRound() {
    if (this.current + this.spent <= 0) return;
    this.current > 0 ? this.current-- : this.spent--;

    animate(this.elements[this.current + this.spent], {
      opacity: 0,
      x: [0, 5],
      duration: 150,
    });
  }

  addSpent() {
    if (this.spent >= this.capacity) return;
    const el = this.elements[this.spent];
    el.src = AmmoCounter.getAmmoIcon(this.roundType, this.roundClass, true);

    animate(el, {
      x: [-5, 0],
      opacity: 0.5,
      duration: 150,
    });
    this.spent++;
    if (this.current > 0) this.current--;
  }

  removeSpent() {
    if (this.spent == 0) return;
    const el = this.elements[this.spent - 1];

    if (this.current > 0) {
      el.src = AmmoCounter.getAmmoIcon(this.roundType, this.roundClass, false);
      animate(el, {
        opacity: 1,
        x: [5, 0],
        duration: 150,
      });
      this.removeRound();
      this.current++;
    } else {
      animate(el, {
        opacity: 0,
        x: [0, 5],
        duration: 150,
      });
    }
    this.spent--;
  }

  static getAmmoIcon(roundType, roundClass, spent) {
    let path = globalConfig.overlayScale >= 1.5 ? "icons_big" : "icons";
    return spent
      ? `${path}/${roundType}_Shell.webp`
      : `${path}/${roundType}_${roundClass}.webp`;
  }
}

for (const [key, value] of new URLSearchParams(window.location.search)) {
  console.log(key, value);
  if (globalConfig[key] != undefined) {
    if (typeof globalConfig[key] == "number") globalConfig[key] = Number(value);
    else if (typeof globalConfig[key] == "boolean")
      globalConfig[key] = value == "true";
    else globalConfig[key] = value;
  }
}

utils.set(":root", { "--scale": globalConfig.overlayScale });

if (!globalConfig.showScorePanel) {
  globalConfig.showEventLog = false;
  globalConfig.showScoreCounter = false;
  globalConfig.showHealth = false;
  globalConfig.showLevelBar = false;
  globalConfig.showPhaseBar = false;
}

if (!globalConfig.showAmmoPanel) {
  globalConfig.showWeaponName = false;
  globalConfig.showAmmoCounter = false;
}

const eventLog = new Log(Math.ceil(globalConfig.eventLogLength));
const scoreCounter = new Counter(Math.ceil(globalConfig.scoreCounterDigits));
const healthBar = new HealthBar();
const levelBar = new ArrowBar("level-bar");
const phaseBar = new ArrowBar("phase-bar");
const ammoCounter = new AmmoCounter("ammo-counter-left");
const ws = connect();

document.getElementById("overlay").style.height =
  document.getElementById("score-panel").offsetHeight + "px";

if (!globalConfig.showScorePanel)
  utils.set("#score-panel", { display: "none" });
if (!globalConfig.showEventLog) utils.set("#log", { display: "none" });
if (!globalConfig.showScoreCounter) utils.set("#counter", { display: "none" });
if (!globalConfig.showHealth) utils.set("#health-bar", { display: "none" });
if (!globalConfig.showLevelBar) utils.set("#level-bar", { display: "none" });
if (!globalConfig.showPhaseBar) utils.set("#phase-bar", { display: "none" });

if (!globalConfig.showAmmoPanel) utils.set("#ammo-panel", { display: "none" });
if (!globalConfig.showWeaponName)
  utils.set("#weapon-left", { display: "none" });
if (!globalConfig.showAmmoCounter)
  utils.set("#ammo-counter-left", { display: "none" });
