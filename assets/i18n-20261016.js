(() => {
  "use strict";
  const english = {
  "KRB 獎牌變化預測工具": "KRB Medal Change Predictor",
  "獎牌變化預測工具": "Medal Change Predictor",
  "只需填入等級數字，順序不影響計算；目前模型不計算卡片稀有度或顏色。": "Enter card levels only; their order does not affect the calculation. The current model does not take card rarity or color into account.",
  "模型 2026-10-26-v6": "Model 2026-10-26-v6",
  "我方": "You",
  "對方": "Opponent",
  "我": "YOU",
  "對": "OPP",
  "英雄": "Hero",
  "四塔": "4 Towers",
  "三法術": "3 Spells",
  "比賽結果：": "Match Result:",
  "比賽結果": "Match Result",
  "勝利": "Victory",
  "敗北": "Defeat",
  "套用上次我方牌組": "Load My Last Deck",
  "清除目前輸入資料": "Clear All Inputs",
  "記住我的牌組": "Remember My Deck",
  "勾選後，完整的我方牌組會保存在這台裝置，下次開啟時自動帶入。": "When checked, your complete deck will be saved on this device and loaded automatically the next time you open this page.",
  "找不到可套用的牌組資料": "No saved deck found.",
  "已套用上次我方牌組": "Your last deck has been loaded.",
  "已清除目前輸入資料": "All inputs have been cleared.",
  "模型預測": "Model Prediction",
  "依雙方最高 3 張卡的等級總和差直接對照分數。": "The medal change is looked up directly using the difference between the sums of each player's three highest card levels.",
  "我方的實際獎牌變化": "Your Actual Medal Change",
  "（不需填入正負號）": "(No + or − sign needed)",
  "例如：30": "e.g. 30",
  "出現尚未收錄的新分數": "This medal change is not yet included in the model.",
  "預測命中": "Prediction matched.",
  "回報文字": "Report",
  "無論預測是否命中，都請複製並回報。": "Please copy and submit the report, whether or not the prediction matched.",
  "一鍵複製": "Copy Report",
  "回報文字已複製": "Report copied.",
  "複製失敗，請手動選取文字": "Copy failed. Please select and copy the text manually.",
  "模型版本：": "Model Version:",
  "我方資料：": "Your Deck:",
  "對方資料：": "Opponent's Deck:",
  "英雄：": "Hero:",
  "四塔：": "4 Towers:",
  "三法術：": "3 Spells:",
  "勝": "Victory",
  "負": "Defeat",
  "預測獎牌變化：": "Predicted Medal Change:",
  "我方實際獎牌變化：": "Your Actual Medal Change:",
  "模型判定：": "Prediction Check:",
  "本工具依玩家實測資料建立；模型版本更新後，預測結果可能改變。": "This tool is based on player-collected match data. Predictions may change when the model is updated.",
  "依玩家實測資料預測 Kingdom Rush Battles 真人對戰獎牌變化。": "Predict medal changes in Kingdom Rush Battles matches against other players using player-collected match data.",
  "自動產生的回報文字": "Automatically Generated Report",
  "我方英雄等級": "Your Hero Level",
  "我方第1張塔等級": "Your Tower 1 Level",
  "我方第2張塔等級": "Your Tower 2 Level",
  "我方第3張塔等級": "Your Tower 3 Level",
  "我方第4張塔等級": "Your Tower 4 Level",
  "我方第1張法術等級": "Your Spell 1 Level",
  "我方第2張法術等級": "Your Spell 2 Level",
  "我方第3張法術等級": "Your Spell 3 Level",
  "對方英雄等級": "Opponent's Hero Level",
  "對方第1張塔等級": "Opponent's Tower 1 Level",
  "對方第2張塔等級": "Opponent's Tower 2 Level",
  "對方第3張塔等級": "Opponent's Tower 3 Level",
  "對方第4張塔等級": "Opponent's Tower 4 Level",
  "對方第1張法術等級": "Opponent's Spell 1 Level",
  "對方第2張法術等級": "Opponent's Spell 2 Level",
  "對方第3張法術等級": "Opponent's Spell 3 Level"
};
  let language = "en";
  function t(key) { return language === "en" ? (english[key] ?? key) : key; }
  function apply() {
    document.documentElement.lang = language === "en" ? "en" : "zh-Hant";
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    ["aria-label", "placeholder", "content"].forEach(attr => {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
        el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`)));
      });
    });
  }
  window.KRBI18n = { t, get language() { return language; } };
  document.getElementById("language-select").value = "en";
  document.getElementById("language-select").addEventListener("change", event => {
    language = event.target.value === "zh" ? "zh" : "en";
    apply();
    document.dispatchEvent(new Event("languagechange"));
  });
  apply();
})();
