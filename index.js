import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Marshal123@",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let userId = 1, color="teal";


async function checkVisited() {
  const result = await db.query("SELECT country_code FROM country_users WHERE user_id=$1", [userId]);
  // console.log(result.rows);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(countries);
  return countries;
}
app.get("/", async (req, res) => {
  const countries = await checkVisited();
  const users= await db.query("Select * from users");
  // console.log(countries);
  console.log(color);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users.rows,
    userId:userId,
    color: color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO country_users (country_code, user_id) VALUES ($1, $2)",
        [countryCode, userId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add)res.render("new.ejs");
  else {
    try{
      userId=parseInt(req.body.user); 
      const result=await db.query("SELECT color FROM users WHERE id=$1", [userId]);
      console.log(result.rows);
      color=result.rows[0].color;
      res.redirect("/");
    }
    catch(err){
      console.log(err);
    }
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  try {
    const result =await db.query(
      "INSERT INTO users (name, color) VALUES ($1, $2) returning id",
      [req.body.name, req.body.color]
    );
    userId=result.rows[0].id;
    color= req.body.color;
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
