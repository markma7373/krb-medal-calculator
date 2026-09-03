(function (root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  if (root) root.KRBMedalModel = model;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "2026-09-03-v4";
  const WIN_SCORES = [20, 22, 25, 28, 30, 33, 36, 39, 41, 44, 46];
  const LOSS_SCORES = [-45, -43, -40, -38, -35, -32, -30, -27, -24, -21, -19, -16, -14];
  const winByDifference = { "-5": 44, "-4": 41, "-3": 39, "-2": 36, "-1": 33, "0": 30, "1": 28, "2": 25, "3": 22 };
  const lossByDifference = { "-5": -16, "-4": -19, "-3": -21, "-2": -24, "-1": -27, "0": -30, "1": -32, "2": -35, "3": -38, "4": -40, "5": -43 };

  function topThreeTotal(cards) {
    if (!Array.isArray(cards) || cards.length !== 8 || cards.some((level) => !Number.isInteger(level))) {
      throw new TypeError("cards must contain exactly 8 integer levels");
    }
    return [...cards].sort((a, b) => b - a).slice(0, 3).reduce((sum, level) => sum + level, 0);
  }

  function medalFromDifference(difference, result) {
    if (!Number.isInteger(difference)) throw new TypeError("difference must be an integer");
    if (result === "win") {
      if (difference <= -6) return 46;
      if (difference >= 4) return 20;
      return winByDifference[String(difference)];
    }
    if (result === "loss") {
      if (difference <= -6) return -14;
      if (difference >= 6) return -45;
      return lossByDifference[String(difference)];
    }
    throw new TypeError("result must be win or loss");
  }

  function predict(selfCards, opponentCards, result) {
    const selfTopThree = topThreeTotal(selfCards);
    const opponentTopThree = topThreeTotal(opponentCards);
    const difference = selfTopThree - opponentTopThree;
    return {
      version: VERSION,
      selfTopThree,
      opponentTopThree,
      difference,
      medal: medalFromDifference(difference, result),
    };
  }

  return { VERSION, WIN_SCORES, LOSS_SCORES, topThreeTotal, medalFromDifference, predict };
});
