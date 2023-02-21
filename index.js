const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
// const MongoClient = require("mongodb").MongoClient;
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// mongodb config
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wibbyk9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

client.connect((err) => {
  const authenticationCollection = client
    .db("onlineBook")
    .collection("authData");

  //singup data added into database
  app.post("/addSignupData", (req, res) => {
    const { email } = req.body;
    authenticationCollection.findOne({ email }).then((existingUser) => {
      if (existingUser) {
        return res.status(400).send({ error: "Email already in use" });
      } else {
        authenticationCollection.insertOne(req.body).then((result) => {
          res.send(result);
        });
      }
    });
  });

  //get login data matching password and number
  app.get("/getAuthData", async (req, res) => {
    authenticationCollection
      .find({
        phoneNumber: req.query?.phoneNumber,
        password: req.query?.password,
        active: true,
      })
      .toArray((err, documents) => {
        if (err) {
          console.error(err);
          res.status(500).send({
            message:
              "An error occurred while retrieving the authentication data.",
          });
        } else {
          res.send(documents);
        }
      });
  });

  //user update status logout  to login
  app.patch("/userStatus/:id", async (req, res) => {
    const statusId = req.params.id;
    const value = req.body.value;

    try {
      const result = await authenticationCollection.updateOne(
        { _id: ObjectId(statusId) },
        { $set: { status: value } }
      );
      res.sendStatus(200);
    } catch (error) {
      console.log("err", error);
      res.sendStatus(500);
    }
  });

  //password Edit
  app.patch("/editPass/:email", async (req, res) => {
    const email = req.params.email;
    const password = req.body.password;

    await authenticationCollection
      .updateOne({ email: email }, { $set: { password: password } })
      .then((result) => {
        res.status(200).send({ message: "Password updated successfully" });
      })
      .catch((error) => {
        res.status(500).send({ message: "Error updating password" });
        console.log(error);
      });
  });

  //mathing gmail for the fortopassword gmail send to inbox and go to the link
  app.get("/getMatchedEmailData", (req, res) => {
    const receivedEmail = req.query.email;
    authenticationCollection
      .find({
        email: receivedEmail,
      })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });

  // mongodb connected message
  console.log("database connected");
});

// root url route
app.get("/", (req, res) => {
  res.send("Hello world");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("app listening");
});
