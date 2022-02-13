const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ObjectId } = require("mongodb");
const { promises } = require("stream");
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const port = 4000;
app.use(bodyParser.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z2baq.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000,
  keepAlive: 1,
});

client.connect((err) => {
  if (!err) console.log("connected");

  const UserCollection = client.db("LicenseSoftware").collection("userData");
  const logsCollection = client.db("LicenseSoftware").collection("logs");
  app.get("/logs", (req, res) => {
    logsCollection.find({}).toArray((err, documents) => {
      res.json(documents);
    });
  });
  const getCollectionSize = (collection) => {
    collection
      .stats()
      .then((count_documents) => {
        const size = count_documents.totalSize / 1024;
        const mb = size / 1024;
        if (size > 0.5) {
          console.log("download");
        }
      })
      .catch((err) => {
        console.log(err.Message);
      });
  };
  getCollectionSize(logsCollection);

  io.on("connection", (socket) => {
    console.log("New client connected " + socket.id);
    socket.on("send_log", (data) => {
      logsCollection.insertOne(data).then((res) => {
        if (res) {
          io.emit("log", data);
        }
      });
    });
  });
  app.get("/", (req, res) => {
    res.send("Hello World!");
  });
});

server.listen(process.env.PORT || port);
