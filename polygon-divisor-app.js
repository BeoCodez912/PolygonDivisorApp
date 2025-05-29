
const contractAddress = "0x97AeB4617851fbCe188fC9940AE9E472621b49Ca";
let web3, contract, userAccount;
let miningEndTime = parseInt(localStorage.getItem("miningEndTime") || "0");

async function connectWallet() {
  if (!window.ethereum) return alert("Install MetaMask");
  web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const accounts = await web3.eth.getAccounts();
  userAccount = accounts[0];
  document.getElementById("walletAddress").innerText = userAccount;
  contract = new web3.eth.Contract(abi, contractAddress);
  getBalanceLive();
  log("Wallet connected", "success");
}
  const abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
{"stateMutability":"payable","type":"receive"},
{"inputs":[],"name":"applyDivisor","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"uint256","name":"multiplier","type":"uint256"}],"name":"applyMultiplier","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"depositDivisor","outputs":[],"stateMutability":"payable","type":"function"},
{"inputs":[],"name":"depositMultiplier","outputs":[],"stateMutability":"payable","type":"function"},
{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getReferrer","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"string","name":"code","type":"string"}],"name":"logInvite","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"logApp","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"redeemPoints","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"startMining","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"increaseSpeed","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"increaseTime","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"withdrawDivisorAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"withdrawDivisorDeposit","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"withdrawDivisoredAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"withdrawMultiplierAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"withdrawToWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];

function depositDivisor() {
  const amount = document.getElementById("depositAmount").value;
  const value = web3.utils.toWei(amount, "ether");
  const min = web3.utils.toBN("1");
  const max = web3.utils.toBN("900000000000000000");
  const valBN = web3.utils.toBN(value);
  if (valBN.lt(min)) return alert("Minimum is 1 wei");
  if (valBN.gt(max)) return alert("Maximum is 0.9 MATIC");
  sendTx("depositDivisor", value);
}

function depositMultiplier() {
  const amount = document.getElementById("depositAmount").value;
  const value = web3.utils.toWei(amount, "ether");
  sendTx("depositMultiplier", value);
}

function applyDivisor() {
  sendTx("applyDivisor");
}

function applyMultiplier() {
  const val = parseInt(document.getElementById("multiplierAmount").value);
  if (isNaN(val) || val < 2 || val > 90) return alert("Enter multiplier between 2 and 90");
  sendTxWithParam("applyMultiplier", val);
}

async function sendTx(method, value = "0") {
  try {
    const gas = await contract.methods[method]().estimateGas({ from: userAccount, value });
    const tx = await contract.methods[method]().send({ from: userAccount, gas, value });
    log(`${method} TX: ${tx.transactionHash}`, "success");
    getBalanceLive();
  } catch (err) {
    log("TX Failed: " + err.message, "error");
  }
}

async function sendTxWithParam(method, param) {
  try {
    const gas = await contract.methods[method](param).estimateGas({ from: userAccount });
    const tx = await contract.methods[method](param).send({ from: userAccount, gas });
    log(`${method}(${param}) TX: ${tx.transactionHash}`, "success");
    getBalanceLive();
  } catch (err) {
    log("TX Failed: " + err.message, "error");
  }
}

function getBalanceLive() {
  contract.methods.getBalance().call({ from: userAccount })
    .then(bal => {
      document.getElementById("walletBalance").innerText = web3.utils.fromWei(bal, "ether") + " MATIC";
    })
    .catch(() => {
      document.getElementById("walletBalance").innerText = "Error";
    });
}

function startMining() {
  const now = Date.now();
  if (now < miningEndTime) {
    const remaining = msToTime(miningEndTime - now);
    alert("Mining in progress. Time left: " + remaining);
    return;
  }

  miningEndTime = now + 86400000; // 24 hours
  localStorage.setItem("miningEndTime", miningEndTime.toString());

  contract.methods.startMining().send({ from: userAccount })
    .then(tx => {
      log("startMining TX: " + tx.transactionHash, "success");
      updateStatus("Mining started", "success");
    })
    .catch(err => log("startMining failed: " + err.message, "error"));
}

function checkMiningTimer() {
  const now = Date.now();
  const timerEl = document.getElementById("miningTimer");
  if (!timerEl) return;

  if (now < miningEndTime) {
    timerEl.innerText = msToTime(miningEndTime - now);
  } else if (miningEndTime !== 0) {
    simulateMiningDay();
    miningEndTime = 0;
    localStorage.setItem("miningEndTime", "0");
    timerEl.innerText = "00:00:00";
    updateStatus("Mining complete. Bonus applied.", "success");
  }
}

function simulateMiningDay() {
  let streak = parseInt(localStorage.getItem("miningStreak") || "0");
  streak += 1;
  localStorage.setItem("miningStreak", streak);
  document.getElementById("miningStreak").innerText = streak;
  updateStatus(`+1 Day Streak (${streak})`, "success");
}

function msToTime(duration) {
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((duration % (1000 * 60)) / 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(n) {
  return n < 10 ? "0" + n : n;
}

function log(msg, type = "info") {
  const logArea = document.getElementById("logArea");
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  const div = document.createElement("div");
  div.textContent = entry;
  logArea.appendChild(div);
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");
  logs.push(entry);
  localStorage.setItem("logs", JSON.stringify(logs));
  updateStatus(msg, type);
}

function updateStatus(text, type) {
  const el = document.getElementById("statusIndicator");
  el.textContent = "Status: " + text;
  el.className = type;
}

function copyToClipboard(id) {
  const text = document.getElementById(id).innerText;
  navigator.clipboard.writeText(text).then(() => updateStatus("Copied", "success"));
}

function clearLogs() {
  localStorage.removeItem("logs");
  document.getElementById("logArea").innerHTML = "";
  updateStatus("Logs cleared", "info");
}

function saveReferral() {
  const code = document.getElementById("referralInput").value;
  localStorage.setItem("referral", code);
  document.getElementById("savedReferral").innerText = code;
  updateStatus("Referral saved", "success");
}

setInterval(checkMiningTimer, 1000);
