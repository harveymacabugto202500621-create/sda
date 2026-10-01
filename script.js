// POS project
// list of the items we sell
var items = [
  { name: "Espresso", price: 85, stock: 20, icon: "☕" },
  { name: "Latte", price: 120, stock: 20, icon: "🥛" },
  { name: "Milk Tea", price: 110, stock: 20, icon: "🧋" },
  { name: "Sandwich", price: 150, stock: 20, icon: "🥪" },
  { name: "Croissant", price: 75, stock: 20, icon: "🥐" },
  { name: "Cake Slice", price: 140, stock: 20, icon: "https://simplytrinicooking.com/wp-content/uploads/red-velvet-cake.jpg" }
];

var order = {};      // current order, example: { Latte: 2 }
var todaySales = 0;  // total money today
var allOrders = [];  // every order that was paid

// load saved data (if there is any)
var saved = localStorage.getItem("posData");
if (saved) {
  var data = JSON.parse(saved);
  todaySales = data.todaySales;
  allOrders = data.allOrders;
  if (data.stock) {
    for (var s = 0; s < items.length; s++) {
      items[s].stock = data.stock[s];
    }
  }
}

function saveData() {
  var stockList = [];
  for (var i = 0; i < items.length; i++) {
    stockList.push(items[i].stock);
  }
  var data = { todaySales: todaySales, allOrders: allOrders, stock: stockList };
  localStorage.setItem("posData", JSON.stringify(data));
}

// make the menu buttons
function makeMenu() {
  var html = "";
  for (var i = 0; i < items.length; i++) {
    var stockText = "Stock: " + items[i].stock;
    var disabled = "";
    if (items[i].stock <= 0) {
      stockText = "SOLD OUT";
      disabled = " disabled";
    }
    html += "<button class='item'" + disabled + " onclick=\"addItem('" + items[i].name + "')\">";
    html += "<span class='icon'>" + items[i].icon + "</span><br>";
    html += items[i].name + "<br>₱" + items[i].price + "<br>";
    html += "<small>" + stockText + "</small>";
    html += "</button>";
  }
  document.getElementById("menu").innerHTML = html;
}

// find the price of an item
function getPrice(name) {
  for (var i = 0; i < items.length; i++) {
    if (items[i].name == name) {
      return items[i].price;
    }
  }
  return 0;
}

function getTotal() {
  var total = 0;
  for (var name in order) {
    total = total + getPrice(name) * order[name];
  }
  return total;
}

// find the item in the list
function getItem(name) {
  for (var i = 0; i < items.length; i++) {
    if (items[i].name == name) {
      return items[i];
    }
  }
}

function addItem(name) {
  // check if there is still stock
  var inOrder = order[name] || 0;
  if (inOrder >= getItem(name).stock) {
    document.getElementById("message").innerHTML = "Not enough stock for " + name + "!";
    return;
  }
  if (order[name]) {
    order[name] = order[name] + 1;
  } else {
    order[name] = 1;
  }
  document.getElementById("message").innerHTML = "";
  showOrder();
}

function removeItem(name) {
  order[name] = order[name] - 1;
  if (order[name] == 0) {
    delete order[name];
  }
  showOrder();
}

// show the current order on the right side
function showOrder() {
  var html = "";
  for (var name in order) {
    html += "<div class='line'>";
    html += "<button onclick=\"removeItem('" + name + "')\">-</button> ";
    html += order[name] + " x " + name;
    html += " = ₱" + getPrice(name) * order[name];
    html += "</div>";
  }
  document.getElementById("orderList").innerHTML = html;
  document.getElementById("total").innerHTML = "₱" + getTotal();
  document.getElementById("todaySales").innerHTML = "₱" + todaySales;
}

function clearOrder() {
  order = {};
  showOrder();
}

function pay() {
  var total = getTotal();
  var cash = Number(document.getElementById("cash").value);
  var message = document.getElementById("message");

  if (total == 0) {
    message.innerHTML = "Order is empty!";
    return;
  }
  if (cash < total) {
    message.innerHTML = "Not enough cash!";
    return;
  }

  // save this order
  var newOrder = { time: new Date().toLocaleTimeString(), items: order, total: total };
  allOrders.push(newOrder);

  // take away the sold items from the stock
  for (var name in order) {
    getItem(name).stock = getItem(name).stock - order[name];
  }
  todaySales = todaySales + total;
  saveData();

  message.innerHTML = "Paid! Change: ₱" + (cash - total);
  order = {};
  document.getElementById("cash").value = "";
  showOrder();
  makeMenu();
}

// dashboard
function showDashboard() {
  var count = allOrders.length;
  var average = 0;
  if (count > 0) {
    average = todaySales / count;
  }

  document.getElementById("dTotal").innerHTML = "₱" + todaySales;
  document.getElementById("dCount").innerHTML = count;
  document.getElementById("dAverage").innerHTML = "₱" + average.toFixed(2);

  // count how many of each item was sold
  var best = "";
  for (var i = 0; i < items.length; i++) {
    var sold = 0;
    for (var j = 0; j < allOrders.length; j++) {
      var qty = allOrders[j].items[items[i].name];
      if (qty) {
        sold = sold + qty;
      }
    }
    best += "<p>" + items[i].name + ": " + sold + " sold</p>";
  }
  document.getElementById("dBest").innerHTML = best;

  // last 5 orders
  var recent = "";
  var start = count - 5;
  if (start < 0) {
    start = 0;
  }
  for (var k = count - 1; k >= start; k--) {
    recent += "<p>" + allOrders[k].time + " - ₱" + allOrders[k].total + "</p>";
  }
  if (count == 0) {
    recent = "<p>No orders yet</p>";
  }
  document.getElementById("dRecent").innerHTML = recent;

  document.getElementById("dashboard").style.display = "block";
}

function hideDashboard() {
  document.getElementById("dashboard").style.display = "none";
}

// inventory
function showInventory() {
  var html = "<table border='1' cellpadding='6'>";
  html += "<tr><th>Item</th><th>Stock</th><th>Add stock</th></tr>";
  for (var i = 0; i < items.length; i++) {
    var status = "";
    if (items[i].stock <= 0) {
      status = " <span class='low'>OUT</span>";
    } else if (items[i].stock <= 5) {
      status = " <span class='low'>LOW</span>";
    }
    html += "<tr><td>" + items[i].icon + " " + items[i].name + "</td>";
    html += "<td>" + items[i].stock + status + "</td>";
    html += "<td><input type='number' id='add" + i + "' style='width:60px'> ";
    html += "<button onclick='restock(" + i + ")'>Add</button></td></tr>";
  }
  html += "</table>";
  document.getElementById("invList").innerHTML = html;
  document.getElementById("inventory").style.display = "block";
}

function restock(i) {
  var amount = Number(document.getElementById("add" + i).value);
  if (amount <= 0) {
    alert("Type a number greater than 0!");
    return;
  }
  items[i].stock = items[i].stock + amount;
  saveData();
  showInventory();
  makeMenu();
}

function hideInventory() {
  document.getElementById("inventory").style.display = "none";
}

// start the program
makeMenu();
showOrder();