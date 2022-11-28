const express = require("express");
const app = express();
const cors = require("cors"); // for resolving cors issue in front end submission
const prodConn = require("./db/Product");
const userConn = require("./db/Users");
require("./db/config");
const Jwt = require("jsonwebtoken");
const jwtKey = "e-comm";

app.use(express.json());
app.use(cors());

// generating the token at the time of signup and Login
// we do not need to add header Token in FrontEnd of Login and Signup
app.post("/register", async (req, res) => {
  let data = new userConn(req.body);
  let result = await data.save();
  //    for deleting pswrd from api output
  result = result.toObject();
  delete result.password;
  //   used JWT token for authentication at the time of login and signup
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      res.send({ Result: "Something went wrong pls try after some time" });
    }
    res.send({ result, auth: token });
  });
});
app.post("/login", async (req, res) => {
  if (req.body.email && req.body.password) 
  {
    let data = await userConn.findOne(req.body).select("-password");
    if (data) 
    {
      Jwt.sign({ data }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) 
        {
          res.send({ Result: "Something went wrong pls try after some time" });
        }
        res.send({ data, auth: token });
      });
    } 
    else {
       res.send({ Result: "No User Found" });
     }
  } 
   else{
         res.send({ Result: "No User Found" });
       }
});
// *****************************************--------

app.get("/products",verifyToken, async (req, res) => {
  let data = await prodConn.find({});
  if (data.length > 0) {
    res.send(data);
  } else {
    res.send({ result: "No Product Found" });
  }
});
app.post("/add-product", verifyToken, async (req, res) => {
  let data = new prodConn(req.body);
  let result = await data.save();
  res.send(result);
});
app.delete("/product/:id", verifyToken, async (req, res) => {
  const result = await prodConn.deleteOne({ _id: req.params.id });
  res.send(result);
});
// For prefill data of Updation.....
app.get("/product/:id", verifyToken, async (req, res) => {
  let result = await prodConn.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send({ result: "No record found" });
  }
});
// For Update product..........
app.put("/product/:id", verifyToken, async (req, res) => {
  let result = await prodConn.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  res.send(result);
});
app.get("/search/:key",verifyToken, async (req, res) => {
  let data = await prodConn.find({
    $or: [
      { name: { $regex: req.params.key } },
      { brand: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  res.send(data);
});
function verifyToken(req,res,next){
    let token= req.headers['authorization'];
    if(token)
    {
        token= token.split(' ')[1];
        Jwt.verify(token, jwtKey, (err,success)=>{
            if(err)
            {
                res.status(401).send({Result: "Pls enter a valid token with header"})
            }
            else{next()}
        })
    } else{
        res.status(403).send({Result: "Pls Add token with header"})
    }
}
app.listen(5000);
