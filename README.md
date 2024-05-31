# Database for developers

## npm install
Run:
``` npm install express body-parser express-session bcrypt mssql dotenv method-override connect-flash ``` 


## Env file
In the .env file parse this 

``` MSSQL_SERVER=localhost
MSSQL_USER=SA
MSSQL_PASSWORD=<your_password>
MSSQL_DATABASE=db_exam

NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678

MONGODB_URI=mongodb://localhost:27100,localhost:27200/
MONGODB_DATABASE=db_exam
MONGODB_REVIEW_COLLECTION=reviews
MONGODB_TITLE_COLLECTION=extra_titles

SESSION_SECRET=<your_secret> ``` 

## To run the program:
Run: 
``` npm start ´´´ 
