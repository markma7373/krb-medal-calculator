(() => {
  "use strict";

  const model = window.KRBMedalModel;
  const { t } = window.KRBI18n;
  const REMEMBER_KEY = "krb-medal-remember-deck";
  const LAST_DECK_KEY = "krb-medal-last-deck";
  let selectedResult = "";
  let currentPrediction = null;

  const byId = (id) => document.getElementById(id);
  const sideFields = (side) => {
    const inputs = [...document.querySelectorAll(`[data-side="${side}"] .level-input`)];
    return { hero: inputs[0], towers: inputs.slice(1, 5), spells: inputs.slice(5, 8) };
  };
  const selfFields = sideFields("self");
  const opponentFields = sideFields("opponent");
  const allLevelInputs = [selfFields.hero, ...selfFields.towers, ...selfFields.spells, opponentFields.hero, ...opponentFields.towers, ...opponentFields.spells];
  const resultButtons = { win: byId("result-win"), loss: byId("result-loss") };
  const applyButton = byId("apply-deck");
  const rememberInput = byId("remember-deck");
  const predictionPanel = byId("prediction-panel");
  const actualInput = byId("actual-medal");
  const statusBox = byId("comparison-status");
  const reportPanel = byId("report-panel");
  const reportTextArea = byId("report-text");

  function readLevel(input) {
    const text = input.value.trim();
    if (!/^\d+$/.test(text)) return null;
    const value = Number(text);
    return Number.isInteger(value) && value >= 1 && value <= 15 ? value : null;
  }

  function readSide(fields) {
    const hero = readLevel(fields.hero);
    const towers = fields.towers.map(readLevel);
    const spells = fields.spells.map(readLevel);
    if (hero === null || towers.includes(null) || spells.includes(null)) return null;
    return { hero, towers, spells, cards: [hero, ...towers, ...spells] };
  }

  function cleanLevelInput(input) {
    const digits = input.value.replace(/\D/g, "").slice(0, 2);
    input.value = digits;
    const value = digits === "" ? null : Number(digits);
    const invalid = value !== null && (value < 1 || value > 15);
    input.classList.toggle("is-invalid", invalid);
    input.setAttribute("aria-invalid", String(invalid));
  }

  function validSavedDeck(deck) {
    if (!deck || typeof deck !== "object") return false;
    const values = [deck.hero, ...(deck.towers || []), ...(deck.spells || [])].map(Number);
    return deck.towers?.length === 4 && deck.spells?.length === 3 && values.length === 8 && values.every((value) => Number.isInteger(value) && value >= 1 && value <= 15);
  }

  function fillSide(fields, deck) {
    fields.hero.value = String(deck.hero ?? "");
    fields.towers.forEach((input, index) => { input.value = String(deck.towers?.[index] ?? ""); });
    fields.spells.forEach((input, index) => { input.value = String(deck.spells?.[index] ?? ""); });
    [fields.hero, ...fields.towers, ...fields.spells].forEach(cleanLevelInput);
  }

  function clearSide(fields) {
    [fields.hero, ...fields.towers, ...fields.spells].forEach((input) => {
      input.value = "";
      input.classList.remove("is-invalid");
      input.setAttribute("aria-invalid", "false");
    });
  }

  function loadSavedDeck() {
    try {
      const deck = JSON.parse(localStorage.getItem(LAST_DECK_KEY) || "null");
      return validSavedDeck(deck) ? deck : null;
    } catch {
      return null;
    }
  }

  function saveDeckIfComplete() {
    if (!rememberInput.checked) return;
    const side = readSide(selfFields);
    if (!side) return;
    localStorage.setItem(LAST_DECK_KEY, JSON.stringify({ hero: side.hero, towers: side.towers, spells: side.spells }));
    applyButton.disabled = false;
  }

  function setResult(result) {
    selectedResult = result;
    Object.entries(resultButtons).forEach(([key, button]) => {
      const checked = key === result;
      button.setAttribute("aria-checked", String(checked));
      button.classList.toggle("selected", checked);
    });
    actualInput.value = "";
    render();
  }

  const formatMedal = (value) => value > 0 ? `+${value}` : String(value);

  function normalizedActual(raw) {
    if (!/^[+-]?\d+$/.test(raw.trim())) return null;
    const magnitude = Math.abs(Number(raw));
    if (!Number.isInteger(magnitude)) return null;
    return selectedResult === "win" ? magnitude : -magnitude;
  }

  function comparison(prediction, actual) {
    const scores = selectedResult === "win" ? model.WIN_SCORES : model.LOSS_SCORES;
    const actualIndex = scores.indexOf(actual);
    if (actualIndex === -1) return { kind: "new", message: t("出現尚未收錄的新分數") };
    if (actual === prediction.medal) return { kind: "hit", message: t("預測命中") };
    const predictedIndex = scores.indexOf(prediction.medal);
    const steps = Math.abs(actualIndex - predictedIndex);
    return { kind: "miss", message: window.KRBI18n.language === "en"
      ? `Prediction did not match. Predicted medal change: ${formatMedal(prediction.medal)}. Difference: ${steps} ${steps === 1 ? "step" : "steps"} in the medal-change table.`
      : `預測未命中，模型預測分數為${formatMedal(prediction.medal)}，相差${steps}個分數檔位` };
  }

  function sideText(side) {
    return [`${t("英雄：")} ${side.hero}`, `${t("四塔：")} ${side.towers.join(window.KRBI18n.language === "en" ? ", " : "、")}`, `${t("三法術：")} ${side.spells.join(window.KRBI18n.language === "en" ? ", " : "、")}`].join("\n");
  }

  function makeReport(self, opponent, prediction, actual, status) {
    return [
      `${t("模型版本：")} ${model.VERSION}`,
      "",
      t("我方資料："),
      sideText(self),
      "",
      t("對方資料："),
      sideText(opponent),
      "",
      `${t("比賽結果：")} ${selectedResult === "win" ? t("勝") : t("負")}`,
      `${t("預測獎牌變化：")} ${formatMedal(prediction.medal)}`,
      `${t("我方實際獎牌變化：")} ${formatMedal(actual)}`,
      `${t("模型判定：")} ${status.message}`,
    ].join("\n");
  }

  function renderActual() {
    statusBox.hidden = true;
    reportPanel.hidden = true;
    const self = readSide(selfFields);
    const opponent = readSide(opponentFields);
    const actual = normalizedActual(actualInput.value);
    if (!self || !opponent || !currentPrediction || actual === null) return;
    const status = comparison(currentPrediction, actual);
    statusBox.className = `comparison-status status-${status.kind}`;
    statusBox.textContent = status.message;
    statusBox.hidden = false;
    reportTextArea.value = makeReport(self, opponent, currentPrediction, actual, status);
    reportPanel.hidden = false;
  }

  function render() {
    const self = readSide(selfFields);
    const opponent = readSide(opponentFields);
    statusBox.hidden = true;
    reportPanel.hidden = true;
    if (!self || !opponent || !selectedResult) {
      currentPrediction = null;
      predictionPanel.hidden = true;
      return;
    }
    currentPrediction = model.predict(self.cards, opponent.cards, selectedResult);
    byId("prediction-score").textContent = formatMedal(currentPrediction.medal);
    predictionPanel.hidden = false;
    renderActual();
  }

  function notify(message) {
    const toast = byId("toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { toast.hidden = true; }, 1800);
  }

  async function copyReport() {
    const text = reportTextArea.value;
    try {
      await navigator.clipboard.writeText(text);
      notify(t("回報文字已複製"));
    } catch {
      reportTextArea.focus();
      reportTextArea.select();
      notify(document.execCommand("copy") ? t("回報文字已複製") : t("複製失敗，請手動選取文字"));
    }
  }

  Object.entries(resultButtons).forEach(([result, button]) => button.addEventListener("click", () => setResult(result)));
  allLevelInputs.forEach((input) => input.addEventListener("input", () => {
    cleanLevelInput(input);
    saveDeckIfComplete();
    render();
  }));
  actualInput.addEventListener("input", () => {
    actualInput.value = actualInput.value.replace(/[^+\-\d]/g, "").slice(0, 3);
    renderActual();
  });
  rememberInput.addEventListener("change", () => {
    localStorage.setItem(REMEMBER_KEY, rememberInput.checked ? "1" : "0");
    saveDeckIfComplete();
  });
  applyButton.addEventListener("click", () => {
    const deck = loadSavedDeck();
    if (!deck) return notify(t("找不到可套用的牌組資料"));
    fillSide(selfFields, deck);
    render();
    notify(t("已套用上次我方牌組"));
  });
  byId("clear-all").addEventListener("click", () => {
    clearSide(selfFields);
    clearSide(opponentFields);
    selectedResult = "";
    Object.values(resultButtons).forEach((button) => {
      button.setAttribute("aria-checked", "false");
      button.classList.remove("selected");
    });
    actualInput.value = "";
    render();
    notify(t("已清除目前輸入資料"));
  });
  byId("copy-report").addEventListener("click", copyReport);

  document.addEventListener("languagechange", () => {
    byId("toast").hidden = true;
    render();
  });

  const savedDeck = loadSavedDeck();
  applyButton.disabled = !savedDeck;
  rememberInput.checked = localStorage.getItem(REMEMBER_KEY) === "1";
  if (rememberInput.checked && savedDeck) fillSide(selfFields, savedDeck);
  render();
})();
