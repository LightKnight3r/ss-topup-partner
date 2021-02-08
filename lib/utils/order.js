module.exports = {
  calculateMoney: (distance, moneyStrategy, priceIncrease, numDes) => {
    const configMoney = moneyStrategy.step || [];
    const min = moneyStrategy.minMoney;
    const moreDesPrice = moneyStrategy.moreDesPrice || 0;

    priceIncrease = priceIncrease || 1;
    numDes = numDes || 1;

    let money = 0;
    for(let i=0; i<configMoney.length; i++) {
      if (configMoney[i].distance === 0) {
        money += configMoney[i].money*distance;
        break;
      } else if (distance >= configMoney[i].distance) {
        distance -= configMoney[i].distance
        money += configMoney[i].money*configMoney[i].distance
      } else {
        money += configMoney[i].money*distance;
        break;
      }
    }

    if(money < min) {
      money = min;
    }

    if(numDes > 1) {
      money += moreDesPrice*(numDes - 1);
    }

    money = money*priceIncrease;

    money = Math.round(money/1000)*1000;

    return money;
  }
}
