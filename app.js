//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://shifin:myMongoCluster@cluster0.cvywejo.mongodb.net/todolistDB"
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Buy Food",
});

const item2 = new Item({
  name: "Cook Food",
});

const item3 = new Item({
  name: "Eat Food",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully added the items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundItem) => {
    if (!err) {
      if (!foundItem) {
        // create a new list

        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();

        res.redirect("/" + customListName);
      } else {
        //  show an existing list

        res.render("list", {
          listTitle: foundItem.name,
          newListItems: foundItem.items,
        });
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list.trim();

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();

    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName.trim();

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successefully deleted checked item.");
        res.redirect("/");
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
