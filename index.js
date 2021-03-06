const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io') (server)

const mysql = require("mysql");

app.use(express.static(path.join(__dirname, '/client')))

io.on('connection', socket => {
    console.log('Someone connected.');


    socket.on("disconnect", () => {
        console.log("Someone left.");
    });
    // Determines what level of maze to run and display to the client
    socket.on("start", difficulty => {
        // If its easy then run the maze with size 31 and pass the grid back to the client to be displayed
        if(difficulty.toLowerCase() == "easy") {
            mazeGen(31);
            io.emit("output", grid)
        }
        // If its medium generate a size 41x41 maze and pass the grid to the client
        if (difficulty.toLowerCase() == "medium") {
            mazeGen(41);
            io.emit("output", grid)
        }
        // If they input hard then pass 51x51 to mazeGen and pass the grid back to the client to be displayed
        if (difficulty.toLowerCase() == "hard") {
            mazeGen(51);
            io.emit("output", grid)
        }
    });

});

// Initialise global variable grid
let grid;

function mazeGen(size) {
    // Create an array initialised to grid
    grid = new Array();
    // Loop through the array and create a new array for each element in the first array
    // We are creating a 2d array
    for (let i = 0; i < size; i++) {
        grid[i] = new Array();
        // Loop through each element of the 2d array and set it to be an empty string
        for (let j = 0; j < size; j++) {
            grid[i][j] = "";
        }
    }
    // Parameters for drawing the maze walls
    // minX = 1, maxX = grid.length - 2, minY = 1, maxY = grid.length - 2
    drawInnerWalls(true, 1, grid.length - 2, 1, grid.length - 2);
    // Draw outer walls after the inner walls to stop holes being made in the outerwalls
    drawOuterWalls();
    // Add the door
    addDoor();
    // Add exit door
    addExit();
}

function drawOuterWalls() {
    // Loop through each row of the grid
    for (let i =  0; i < grid.length; i++) {
        // If ith row is 0 or is the last row in the square then add a wall
        // We have grid.length - 1 because we start at 0 in the array
        if (i == 0 || i == grid.length -1) {
            // Loop through the each column and add a wall
            for (let j = 0; j < grid.length; j++) {
                grid[i][j] = "wall";
                
            }
        }
        else {
            // If the row isnt the first or last
            // Add a wall on every row in the first column
            grid[i][0] = "wall";
            // Add a wall on every row in the last column
            grid[i][grid.length -1] = "wall";
        }
    }
    
}

function randNumber (minimum, maximum) {
    // return a random integer between the min and max values
    return Math.floor(Math.random() * (maximum - minimum + 1) + minimum);
}

function drawHorizontalWall(minimumX, maximumX, wallOnY) {
    // Define where holes can be placed
    // A random number between the maximum and minimum values is picked 
    // To stop holes being covered up by walls we will only allow walls to be placed on even cells and holes to be placed in odd cells
    let hole = Math.floor(randNumber(minimumX, maximumX)/2)*2+1

    // Set i to be the minimumX value and loop until it is the maximumX value
    for (let i = minimumX; i <= maximumX; i++) {
        // If i finds a hole, then set it to be the empty string, so we can pass through it
        if (i == hole) {
            // We use wallY here because we need to know how high up the grid we can place our wall if its horizontal
            grid[wallOnY][i] = "";
        }
        // If i is not a hole then
        else {
            // Set it to be a wall so we cannot pass through it
            grid[wallOnY][i] = "wall";
        }
    }
}

function drawVerticalWall(minimumY, maximumY, wallOnX) {
    // Same as above, we let hole be a random number between the min and max Y values on our line
    // We also set it to be an odd number so no walls interesct the holes preventing us from passing through
    let hole = Math.floor(randNumber(minimumY, maximumY)/2)*2+1

    // set i to be the minimumY value and loop through each Y value until we get to the max
    for (let i = minimumY; i <= maximumY; i++) {
        // If the current value i is a hole
        if (i == hole) {
            // Set the hole to be an empty string so we can pass through it
            // Use wallX here as we need to know how far along to place our vertical wall
            grid[i][wallOnX] = "";
        }
        // If i is not a hole then
        else {
            // Set the space to be a wall so we cannot pass through it
            grid[i][wallOnX] = "wall";
        }
    }
}

function drawInnerWalls(isDone, minimumX, maximumX, minimumY, maximumY) {
    if (isDone) {
        // Base case, stops us from getting 2 wide walls
        if (maximumX - minimumX < 2) {
            return;
        }
        // Recursive case
        else {
        // Declaring variable that determines where on the Y axis a wall will be placed
        let wallOnY = Math.floor(randNumber(minimumY, maximumY)/2)*2; // Must be even to stop intersecting with holes
        // Now call the draw wall function so we can draw the wall passing the correct parameters
        drawHorizontalWall(minimumX, maximumX, wallOnY);

        // Now we recursively add more walls using the methods above
        // Need minimumX and maxX for the vertical walls
        // Need minY to determine where the start is
        // Need wallOnY - 1 to determine where the new max is for the next wall
        drawInnerWalls(!isDone, minimumX, maximumX, minimumY, wallOnY - 1);
        // Need to call recursively for the second half of the maze
        // Need the first 3 as above
        // Need the wallOnY + 1 to determine where the new section begins
        // maxY is used to determine the maxY value as before
        drawInnerWalls(!isDone, minimumX, maximumX, wallOnY + 1, maximumY);
        }
    }
    else {
        // Same as above but with Y values
        if (maximumY - minimumY < 2) {
            return;
        }
        else {
            // Declare variable that determines where on the x axis we can make a new wall
            let wallOnX = Math.floor(randNumber(minimumX, maximumX,)/2)*2; // Must be even so we dont intersect with any holes
            // Call the draw wall method
            drawVerticalWall(minimumY, maximumY, wallOnX);
            // Recursively call the the draw inner walls method passing the new parameters as needed (SAME AS ABOVE BUT CHANGE X AND Y)
            drawInnerWalls(!isDone, minimumX, wallOnX - 1, minimumY, maximumY);
            // Same as before but change X and Y
            drawInnerWalls(!isDone, wallOnX + 1, maximumX, minimumY, maximumY);

        }
    }
}

function addDoor() {
    // Randomly add a door to the maze keeping it on an odd number so no walls block the door
    let x = Math.floor(randNumber(1, grid.length - 1)/2)*2+1;
    // Call the element door
    grid[grid.length -1][x] = "door";
}
function addExit() {
    // Make odd so its not blocked
    let x = Math.floor(randNumber(1, grid.length - 1)/2)*2+1;

    grid[0][x] = "exit";
}

// Create connection to database
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "scores"
});
// // Create the database
// db.connect(function(err) {
//     if (err) {
//         throw err;
//     }
//     console.log("MySQL Connected")
//     db.query("CREATE DATABASE scores", (err, result) => {
//         if (err) throw err;
//         console.log("Database created");
//     });
// });

// // Create a table in the created database
// db.connect(err => {
//     if (err) throw err;
//     console.log("Connected")
//     let sql = "CREATE TABLE high_scores (id int AUTO_INCREMENT PRIMARY KEY, user_name VARCHAR(255), score VARCHAR(255), difficulty VARCHAR(255))";
//     db.query(sql, (err, result) => {
//         if (err) throw err;
//         console.log("Table created");
//     })
// })

// Insert scores



server.listen(3000, () => {
    console.log('Listening on: *', 3000);
})
