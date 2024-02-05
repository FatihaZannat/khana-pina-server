require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const port =  5000

app.use(cors())
app.use(express.json())

console.log(process.env.DB_PASS, process.env.DB_USER);


const { MongoClient, ServerApiVersion } = require('mongodb');
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

    const menuCollection = client.db("khana-pina").collection("menu")
    const reviewCollection = client.db("khana-pina").collection("review")

    app.get('/menu', async(req, res) => {
        const allMenu = await menuCollection.find().toArray()
        res.send(allMenu)
    })

    app.get('/review', async(req, res)=>{
        const review = await reviewCollection.find(). toArray()
        res.send(review)
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