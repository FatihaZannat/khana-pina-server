require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const port =  5000

app.use(cors())
app.use(express.json())

console.log(process.env.DB_PASS, process.env.DB_USER);


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const { config } = require('dotenv')
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1gd1ede.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("khana-pina").collection("users")
    const menuCollection = client.db("khana-pina").collection("menu")
    const reviewCollection = client.db("khana-pina").collection("review")
    const cartCollection = client.db("khana-pina").collection("carts")


    // users api
    app.post('/users', async(req,res)=>{
      const data = req.body
      const result = await userCollection.insertOne(data)
      res.send(result)
    })
    app.get('/users', async(req, res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    app.delete('/users/:id', async(req, res)=> {
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })
    app.patch('/users/:id', async(req, res) => {
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const updateDoc = {
        $set: {
          role: "Admin"
        }
      }
      const result = await userCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    // menu api
    app.get('/menu', async(req, res) => {
        const allMenu = await menuCollection.find().toArray()
        res.send(allMenu)
    })

    app.get('/review', async(req, res)=>{
        const review = await reviewCollection.find(). toArray()
        res.send(review)
    })
    
    // carts collection

    app.get('/carts', async(req, res)=>{
      const email = req.query.email
      console.log(email);
      const query = {email : email}
      const carts = await cartCollection.find(query).toArray()
      res.send(carts)
    })

    app.post('/carts' , async(req, res)=>{
      const cart = req.body
      const result = await cartCollection.insertOne(cart)
      res.send(result)
    })
    app.delete('/carts/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id :new ObjectId(id)}
      const result =await cartCollection.deleteOne(query)
      // console.log(result);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',( req, res ) => {
    res.send('Khana Pina is running')
}) 

app.listen(port, ()=> {
    console.log(`app is running at ${port}`);
})