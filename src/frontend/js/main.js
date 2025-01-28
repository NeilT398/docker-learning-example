async function fetchAsync(url) {
  let response = await fetch(url);
  let data = await response.json();

  return data;
}


async function getListItems() {
  return fetchAsync("http://127.0.0.1:8000/api/get-list-items");
}


async function renderList() {
  var items = await getListItems();
  var list = document.getElementById("shopping-list");

  for (var i=0; i < items.length; i++) {
    var node = document.createElement("li");
    var text = document.createTextNode(items[i]);

    node.appendChild(text);
    list.appendChild(node);
  }
}
