const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient, CURSOR_FLAGS } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tqbro.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('heroRider');
        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');

        app.get('/orders', async (req, res) => {
            const result = await ordersCollection.find({}).toArray();
            res.json(result);
        })

        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await ordersCollection.findOne(query);
            res.json(result);
        })

        app.post('/orders', async (req, res) => {
            const appointment = req.body;
            const result = await ordersCollection.insertOne(appointment);
            res.json(result)
        });

        app.put('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const payment = req.body;
            const filter = { user: user };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        app.get('/users', async (req,res)=>{
            const page = req.query.page;
            const size = parseInt(req.query.size);
            const cursor = await usersCollection.find({});
            let result;
            const count = await cursor.count();
            if(page){
                result = await cursor.skip(page*size).limit(size).toArray();
            }
            else{
                result = await cursor.toArray();
            }
            res.json({count,result});
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.send({ admin: isAdmin })
        });

        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const found = await usersCollection.findOne(filter)
            if (!found) {
                res.send({ isRegistered: false });
                return;
            }
            if (found?.role === "admin") {
                res.send({ isAdmin:true });
                return;
            }
            const updateRole = {
                $set: {
                    role: 'admin',
                    type: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updateRole);
            res.send(result);
        });

        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        })

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Welcome to Hero Rider')
})

app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
})