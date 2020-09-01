import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));

app.use(bodyParser.json());

{/* Function to perform operations into the database */}
const withDB = async (operations, res) => {

    try 
    {
        { /* Connect to the MongoDB server and set the database*/}
        const client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
        const db = client.db('my-blog');

        await operations(db);

        { /*Closing database connection*/}  
        client.close();

    }
    catch(error) {
        res.status(500).json({ message: 'Error connecting MongoDB my-blog database!', error });
    }

}

{/* GET function to return an article info to front-end using JSON format */}
app.get('/api/articles/:name', async (req, res) => {

    { /* Get the name paramenter from the URL*/}
    const articleName = req.params.name;

    withDB(async (db) => {

        { /* Retrieve data from the article using JSON format*/}        
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        { /*Return data to front-end using JSON format*/}           
        res.status(200).json(articleInfo);

    }, res);

});

{/* POST function to increment upvotes field of an article and return the updated article info to front-end using JSON format */}
app.post('/api/articles/:name/upvote', async (req, res) => {

    { /* Get the name paramenter from the URL*/}
    const articleName = req.params.name;

    withDB(async (db) => {

        { /* Retrieve data from the article using JSON format*/}        
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        { /* Update upvotes value into the articles collection*/}     
        await db.collection('articles').updateOne({ name: articleName },
            { '$set': { upvotes: articleInfo.upvotes + 1, },
        });

        { /* Retrieve data from the updated article using JSON format*/}  
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName }); 

        { /*Return data to front-end using JSON format*/}       
        res.status(200).json(updatedArticleInfo);

    }, res);
    
});

{/* POST function to add a comment in an article and return the updated article info to front-end using JSON format */}
app.post('/api/articles/:name/add-comment', async (req, res) => {

    { /* Get the JSON comment data and name paramenter from the front-end*/}
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {

        { /* Retrieve data from the article using JSON format*/}        
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        { /* Update comments field adding a new one into the articles collection*/}     
        await db.collection('articles').updateOne({ name: articleName },
            { '$set': { comments: articleInfo.comments.concat({ username, text }), },
        });

         { /* Retrieve data from the updated article using JSON format*/}  
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName }); 

        { /*Return data to front-end using JSON format*/}       
        res.status(200).json(updatedArticleInfo);

    }, res);        
    
});

/* Set that all the requests made by APIs should pass by the server app*/
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));

});

app.listen(8000, () => console.log('Listening on port 8000'));