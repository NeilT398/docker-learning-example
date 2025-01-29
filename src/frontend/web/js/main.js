async function fetchAsync(url) {
  let response = await fetch(url);
  let data = await response.json();

  return data;
}


async function getListItems() {
  return fetchAsync("/api/get-list-items");
}


async function renderList() {
  var items = await getListItems();
  var list = document.getElementById("shopping-list");
  list.replaceChildren();

  for (var i=0; i < items.length; i++) {
    var node = document.createElement("li");
    var text = document.createTextNode(items[i]);

    node.appendChild(text);
    list.appendChild(node);
  }
}
