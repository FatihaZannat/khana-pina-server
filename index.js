require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRE_KEY)
const app = express()
const port = 5000

app.use(cors())
app.use(express.json())

console.log(process.env.DB_PASS, process.env.DB_USER);


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('express');
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
    const paymentCollection = client.db("khana-pina").collection("payment")

    // authorization middleware

    const verifyToken = (req, res, next) => {
      // console.log('hello',req.headers.authorization);

      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'Anauthorized user' })
      }
      const token = req.headers?.authorization?.split(' ')[1]
      jwt.verify(token, process.env.SECRET_KEY, (err, decode) => {
        if (err) {
          // console.log(err);
          return res.status(401).send({ message: 'Anauthorized access' })
        }
        req.decode = decode
        next()
      })

    }
    const verifyAdmin = async (req, res, next) => {
      // console.log(req);
      const email = req.decode.email
      const query = { email: email }
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'Admin'
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbiden access' })
      }
      next()
    }
    // json web token 
    app.post('/jwt', async (req, res) => {
      const userInfo = req.body
      // console.log(userInfo);
      const token = jwt.sign(userInfo, process.env.SECRET_KEY, { expiresIn: '1h' })
      // console.log(token);
      res.send({ token })
    })


    // users api
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      // console.log('verify', req.decode); 
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    // check user admin or not
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const userEmail = req.params.email
      if (userEmail !== req.decode.email) {
        return res.status(403).send({ message: 'Anauthorized access' })
      }
      const query = { email: userEmail }
      const user = await userCollection.findOne(query)
      // console.log(user);
      const admin = user?.role === 'Admin'
      // console.log({ admin });
      res.send({ admin })

    })
    app.post('/users', verifyToken, async (req, res) => {
      const data = req.body
      const result = await userCollection.insertOne(data)
      res.send(result)
    })
    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })
    app.patch('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: "Admin"
        }
      }
      const result = await userCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    // menu api
    app.get('/menu', async (req, res) => {
      const allMenu = await menuCollection.find().toArray()
      res.send(allMenu)
    })
    app.get('/menu/:id',async (req, res)=> {
      const id = req.params.id
      const query = { _id : id}
      const result = await menuCollection.findOne(query)
      // console.log(result);
      res.send(result)
    })
    app.post('/menu', async(req, res)=>{
      const item = req.body
      const result = await menuCollection.insertOne(item)
      res.send(result)
    })
    app.delete('/menu/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await menuCollection.deleteOne(query)
      res.send(result)
    })
    app.patch('/menu/:id', async(req, res) => {
      console.log('patch is hit');
      const id = req.params.id
      const data = req.body
      // console.log(data , id);
      const query = {_id : id}
      const updateDoc = {
        $set: {
          name: data.name,
          price: data.price,
          recipe: data.recipe,
          category: data.category,
          image: data.image
        }
      }
      const result = await menuCollection.updateOne(query , updateDoc)
      console.log(result);
      res.send(result)
    })
    app.get('/review', async (req, res) => {
      const review = await reviewCollection.find().toArray()
      res.send(review)
    })


    // carts collection

    app.get('/carts', async (req, res) => {
      const email = req.query.email
      console.log(email);
      const query = { email: email }
      const carts = await cartCollection.find(query).toArray()
      res.send(carts)
    })

    app.post('/carts', async (req, res) => {
      const cart = req.body
      const result = await cartCollection.insertOne(cart)
      res.send(result)
    })
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query)
      // console.log(result);
      res.send(result)
    })


    // payment intent

    app.get('/payments/:email',verifyToken, async(req, res)=>{
      const query = {email: req.params.email}
      const verifyEmail = req.decode?.email
      if(req.params.email !== verifyEmail){
        return res.status(403).send({message: 'unauthorized'})
      }
      const result = await paymentCollection.find(query).toArray()
      res.send(result)
      console.log(result);
    })

    app.post('/create-payment-intent', async(req, res)=>{
      const {price} = req.body
      const calculatePayment = price * 100

      const paymentIntent = await stripe.paymentIntents.create({
        amount: calculatePayment,
        currency: 'inr',
        // description:'payment',
        payment_method_types: ['card']
      })

      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    })
    app.post('/payments', async(req, res)=>{
      const paymentData = req.body
      const paymentResult = await paymentCollection.insertOne(paymentData)

      // then delete from cartsCollection
      const query = {_id: {
        $in: paymentData.cartIds.map(id =>new ObjectId(id))
      }}
      const deleteResult = await cartCollection.deleteMany(query)
      res.send({paymentResult, deleteResult})
    })


    // aggegation pipeline

    app.get('/admin-stats', verifyToken, verifyAdmin, async(req, res) => {
      const users = await userCollection.estimatedDocumentCount()
      const menu = await menuCollection.estimatedDocumentCount()
      const  orders = await paymentCollection.estimatedDocumentCount()

      const result = await paymentCollection.aggregate([
        {
          $group:{
            _id: null,
            totalRevenue: {$sum: "$price"}
          }
        }
      ]).toArray()
      const revenue = result.length > 0 ? result[0].totalRevenue : 0
    
      res.send({users, menu , orders, revenue})
    })

    app.get('/order-stats', verifyToken , verifyAdmin, async(req, res)=> {
      const result = await paymentCollection.aggregate([
        {$unwind: '$menuItemIds'},
        {$lookup: {
          from:"menu",
          localField: "menuItemIds",
          foreignField: "_id",
          as: "menuItem"
        }},
        {$unwind: "$menuItem"},{
          $group: {
            _id: "$menuItem.category",
            itemCount:{$sum: 1},
            totalRevenue: {$sum: '$menuItem.price'}
          },
        },{
          $project: {
            _id: 0,
            category: '$_id',
            itemCount: 1,
            totalRevenue: 1
          }
        }
      ]).toArray()
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


app.get('/', (req, res) => {
  res.send('Khana Pina is running')
})

app.listen(port, () => {
  console.log(`app is running at ${port}`);
})