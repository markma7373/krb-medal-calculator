(() => {
  "use strict";

  const MODEL_VERSION = "2026-09-03-v3";
  const SENSITIVITY = 0.2;
  const WIN_SCORES = [20, 22, 25, 28, 30, 33, 36, 39, 41, 44, 46];
  const LOSS_SCORES = [-45, -43, -40, -38, -35, -32, -30, -27, -24, -21, -19, -16, -14];
  const REMEMBER_KEY = "krb-medal-remember-deck";
  const LAST_DECK_KEY = "krb-medal-last-deck";

  const resultButtons = {
    win: document.getElementById("result-win"),
    loss: document.getElementById("result-loss"),
  };
  const rememberButton = document.getElementById("remember-deck");
  const buttons = [...document.querySelectorAll("button")];
  const applyButton = buttons.find((button) => button.textContent.trim() === "套用上次我方牌組");
  const clearButton = buttons.find((button) => button.textContent.includes("清除目前輸入資料"));
  const controlPanel = document.querySelector("section.control-panel");

  let selectedResult = "";
  let rememberDeck = false;

  const field = (label) => document.querySelector(`input[aria-label="${label}"]`);
  const sideFields = (name) => ({
    playerLevel: field(`${name}玩家等級`),
    hero: field(`${name}英雄等級`),
    towers: [1, 2, 3, 4].map((index) => field(`${name}第${index}張塔等級`)),
    spells: [1, 2, 3].map((index) => field(`${name}第${index}張法術等級`)),
  });

  const selfFields = sideFields("我方");
  const opponentFields = sideFields("對方");
  const allInputs = [
    selfFields.playerLevel,
    selfFields.hero,
    ...selfFields.towers,
    ...selfFields.spells,
    opponentFields.playerLevel,
    opponentFields.hero,
    ...opponentFields.towers,
    ...opponentFields.spells,
  ].filter(Boolean);

  const readInteger = (input, min, max) => {
    const text = input?.value.trim() ?? "";
    if (!/^\d+$/.test(text)) return null;
    const value = Number(text);
    return Number.isInteger(value) && value >= min && value <= max ? value : null;
  };

  const readSide = (fields) => {
    const playerLevel = readInteger(fields.playerLevel, 1, 99);
    const hero = readInteger(fields.hero, 1, 15);
    const towers = fields.towers.map((input) => readInteger(input, 1, 15));
    const spells = fields.spells.map((input) => readInteger(input, 1, 15));
    if (playerLevel === null || hero === null || towers.some((value) => value === null) || spells.some((value) => value === null)) {
      return null;
    }
    return { playerLevel, hero, towers, spells, cards: [hero, ...towers, ...spells] };
  };

  const fillSide = (fields, deck) => {
    fields.playerLevel.value = String(deck.playerLevel ?? "");
    fields.hero.value = String(deck.hero ?? "");
    fields.towers.forEach((input, index) => { input.value = String(deck.towers?.[index] ?? ""); });
    fields.spells.forEach((input, index) => { input.value = String(deck.spells?.[index] ?? ""); });
  };

  const clearSide = (fields) => {
    fields.playerLevel.value = "";
    fields.hero.value = "";
    fields.towers.forEach((input) => { input.value = ""; });
    fields.spells.forEach((input) => { input.value = ""; });
  };

  const topThreeTotal = (cards) => [...cards].sort((a, b) => b - a).slice(0, 3).reduce((sum, level) => sum + level, 0);

  const scoreFromPoints = (points, result) => {
    if (result === "win") {
      if (points < 15) return 46;
      if (points < 17.5) return 44;
      if (points < 20) return 41;
      if (points < 22.5) return 39;
      if (points < 25.5) return 36;
      if (points < 28.5) return 33;
      if (points < 31) return 30;
      if (points < 33.5) return 28;
      if (points < 36.5) return 25;
      if (points < 39) return 22;
      return 20;
    }
    if (points < 15) return -14;
    if (points < 17.5) return -16;
    if (points < 20) return -19;
    if (points < 22.5) return -21;
    if (points < 25.5) return -24;
    if (points < 28.5) return -27;
    if (points < 31) return -30;
    if (points < 33.5) return -32;
    if (points < 36.5) return -35;
    if (points < 39) return -38;
    if (points < 41.5) return -40;
    if (points < 44) return -43;
    return -45;
  };

  const formatMedal = (value) => value > 0 ? `+${value}` : String(value);

  const predict = (self, opponent) => {
    const difference = topThreeTotal(self.cards) - topThreeTotal(opponent.cards);
    const winRate = 1 / (1 + Math.exp(-SENSITIVITY * difference));
    return {
      winRate,
      medal: scoreFromPoints(60 * winRate, selectedResult),
    };
  };

  const setResult = (result) => {
    selectedResult = result;
    Object.entries(resultButtons).forEach(([key, button]) => {
      if (!button) return;
      const checked = key === result;
      button.setAttribute("aria-checked", String(checked));
      button.dataset.state = checked ? "checked" : "unchecked";
      button.innerHTML = checked ? '<span aria-hidden="true" style="display:block;width:8px;height:8px;border-radius:999px;background:currentColor"></span>' : "";
      const label = button.closest("label");
      label?.classList.toggle("selected-win", checked && key === "win");
      label?.classList.toggle("selected-loss", checked && key === "loss");
    });
    render();
  };

  const setRemember = (checked) => {
    rememberDeck = checked;
    rememberButton?.setAttribute("aria-checked", String(checked));
    if (rememberButton) {
      rememberButton.dataset.state = checked ? "checked" : "unchecked";
      rememberButton.textContent = checked ? "✓" : "";
    }
    localStorage.setItem(REMEMBER_KEY, checked ? "1" : "0");
    saveDeckIfComplete();
  };

  const saveDeckIfComplete = () => {
    if (!rememberDeck) return;
    const deck = readSide(selfFields);
    if (!deck) return;
    const { cards, ...saved } = deck;
    localStorage.setItem(LAST_DECK_KEY, JSON.stringify(saved));
    if (applyButton) applyButton.disabled = false;
  };

  const loadSavedDeck = () => {
    try {
      const raw = localStorage.getItem(LAST_DECK_KEY);
      if (!raw) return null;
      const deck = JSON.parse(raw);
      if (!deck || !Array.isArray(deck.towers) || deck.towers.length !== 4 || !Array.isArray(deck.spells) || deck.spells.length !== 3) return null;
      return deck;
    } catch {
      return null;
    }
  };

  const sideText = (side) => [
    `玩家等級：${side.playerLevel}`,
    `英雄：${side.hero}`,
    `四塔：${side.towers.join("、")}`,
    `三法術：${side.spells.join("、")}`,
  ].join("\n");

  const normalizedActual = (raw) => {
    if (!/^[+-]?\d+$/.test(raw.trim())) return null;
    const magnitude = Math.abs(Number(raw));
    if (!Number.isInteger(magnitude)) return null;
    return selectedResult === "win" ? magnitude : -magnitude;
  };

  const comparison = (prediction, actual) => {
    const scores = selectedResult === "win" ? WIN_SCORES : LOSS_SCORES;
    const actualIndex = scores.indexOf(actual);
    if (actualIndex === -1) return { kind: "new", message: "出現尚未收錄的新分數" };
    if (actual === prediction.medal) return { kind: "hit", message: "預測命中" };
    const predictedIndex = scores.indexOf(prediction.medal);
    const distance = Math.abs(actualIndex - predictedIndex);
    return {
      kind: "miss",
      message: `預測未命中，模型預測分數為${formatMedal(prediction.medal)}，相差${distance}個分數檔位`,
    };
  };

  const reportText = (self, opponent, prediction, actual, status) => [
    `模型版本：${MODEL_VERSION}`,
    "",
    "我方資料：",
    sideText(self),
    "",
    "對方資料：",
    sideText(opponent),
    "",
    `比賽結果：${selectedResult === "win" ? "勝" : "負"}`,
    `系統推算我方勝率：${(prediction.winRate * 100).toFixed(2)}%`,
    `預測獎牌變化：${formatMedal(prediction.medal)}`,
    `我方實際獎牌變化：${formatMedal(actual)}`,
    `模型判定：${status.message}`,
  ].join("\n");

  const notify = (message) => {
    let toast = document.getElementById("krb-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "krb-toast";
      toast.style.cssText = "position:fixed;left:50%;top:20px;z-index:9999;transform:translateX(-50%);padding:10px 16px;border-radius:12px;background:#0f172a;color:white;border:1px solid rgba(255,255,255,.2);font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,.35)";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { toast.hidden = true; }, 1800);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("回報文字已複製");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      notify(copied ? "回報文字已複製" : "複製失敗，請手動選取文字");
    }
  };

  const render = () => {
    document.getElementById("krb-prediction")?.remove();
    document.getElementById("krb-report")?.remove();

    const self = readSide(selfFields);
    const opponent = readSide(opponentFields);
    if (!self || !opponent || !selectedResult || !controlPanel) return;

    const prediction = predict(self, opponent);
    const section = document.createElement("section");
    section.id = "krb-prediction";
    section.className = "prediction-panel";
    section.setAttribute("aria-live", "polite");
    section.innerHTML = `
      <div>
        <p class="text-sm font-bold tracking-[0.12em] text-amber-200/70">模型預測</p>
        <div class="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <p class="text-4xl font-black tabular-nums text-amber-300">${formatMedal(prediction.medal)}</p>
          <p class="text-base text-slate-200">系統推算我方勝率 <strong class="text-xl text-white">${(prediction.winRate * 100).toFixed(2)}%</strong></p>
        </div>
      </div>
      <div class="mt-6 max-w-xs">
        <label class="mb-2 block text-base text-white" for="actual-medal">我方的實際獎牌變化（不需填入正負號）</label>
        <input class="h-12 w-full rounded-xl border border-amber-300/25 bg-black/25 px-3 text-lg font-bold tabular-nums text-white" id="actual-medal" inputmode="numeric" placeholder="例如：19" type="text" />
      </div>`;
    controlPanel.insertAdjacentElement("afterend", section);

    const actualInput = section.querySelector("#actual-medal");
    actualInput.addEventListener("input", () => {
      document.getElementById("krb-comparison")?.remove();
      document.getElementById("krb-report")?.remove();
      const actual = normalizedActual(actualInput.value);
      if (actual === null) return;
      const status = comparison(prediction, actual);

      const statusBox = document.createElement("div");
      statusBox.id = "krb-comparison";
      statusBox.className = `comparison-status status-${status.kind}`;
      statusBox.innerHTML = `<span>${status.message}</span>`;
      section.appendChild(statusBox);

      const report = document.createElement("section");
      report.id = "krb-report";
      report.className = "report-panel";
      const text = reportText(self, opponent, prediction, actual, status);
      report.innerHTML = `
        <div class="mb-3 flex items-center justify-between gap-3">
          <div><h2 class="text-lg font-bold text-white">回報文字</h2><p class="mt-1 text-sm text-slate-400">無論預測是否命中，都請複製並回報。</p></div>
          <button id="copy-report" class="h-11 rounded-xl bg-amber-400 px-5 font-bold text-slate-950 hover:bg-amber-300" type="button">一鍵複製</button>
        </div>
        <textarea aria-label="自動產生的回報文字" class="min-h-72 w-full resize-y rounded-xl border border-white/10 bg-black/25 p-3 font-mono text-sm leading-6 text-slate-200" readonly></textarea>`;
      report.querySelector("textarea").value = text;
      report.querySelector("#copy-report").addEventListener("click", () => copyText(text));
      section.insertAdjacentElement("afterend", report);
    });
  };

  Object.entries(resultButtons).forEach(([result, button]) => {
    button?.addEventListener("click", () => setResult(result));
    button?.closest("label")?.addEventListener("click", (event) => {
      if (event.target !== button) {
        event.preventDefault();
        setResult(result);
      }
    });
  });

  rememberButton?.addEventListener("click", () => setRemember(!rememberDeck));
  rememberButton?.closest("div")?.querySelector("label")?.addEventListener("click", (event) => {
    event.preventDefault();
    setRemember(!rememberDeck);
  });

  applyButton?.addEventListener("click", () => {
    const saved = loadSavedDeck();
    if (!saved) return notify("找不到可套用的牌組資料");
    fillSide(selfFields, saved);
    render();
    notify("已套用上次我方牌組");
  });

  clearButton?.addEventListener("click", () => {
    clearSide(selfFields);
    clearSide(opponentFields);
    setResult("");
    notify("已清除目前輸入資料");
  });

  allInputs.forEach((input) => input.addEventListener("input", () => {
    saveDeckIfComplete();
    render();
  }));

  const savedDeck = loadSavedDeck();
  if (applyButton) applyButton.disabled = !savedDeck;
  rememberDeck = localStorage.getItem(REMEMBER_KEY) === "1";
  setRemember(rememberDeck);
  if (rememberDeck && savedDeck) fillSide(selfFields, savedDeck);
  render();
})();
