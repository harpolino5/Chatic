require("dotenv").config()
let db = require("./db")//приєднали файл с базою даниз
let http = require("http")
let path = require("path")
let fs = require("fs")//express(basa danih)
let { Server } = require("socket.io")
let bcrypt = require("bcrypt")
const { json } = require("stream/consumers")
let jwt = require("jsonwebtoken")
const { isUndefined } = require("util")
// console.log(process.env.HOST)

// db.query("SHOW TABLES", function(err,result){
//     if(err){
//         console.error(err)
//     }else{
//         console.log(result)
//     }
// })

let pathToIndex = path.join(__dirname, "static", "index.html")
let index = fs.readFileSync(pathToIndex, "utf-8")

let pathToStyle = path.join(__dirname, "static", "style.css")
let style = fs.readFileSync(pathToStyle, "utf-8")

let pathToScript = path.join(__dirname, "static", "script.js")
let script = fs.readFileSync(pathToScript, "utf-8")

let pathToRegister = path.join(__dirname, "static", "register.html")
let register = fs.readFileSync(pathToRegister, "utf-8")

let pathToAuth = path.join(__dirname, "static", "auth.js")
let auth = fs.readFileSync(pathToAuth, "utf-8")

let pathToLogin = path.join(__dirname, "static", "login.html")
let loginPage = fs.readFileSync(pathToLogin, "utf-8")


let ser = http.createServer((req, res) => {
    switch (req.url) {
        case "/":
            if(!guarded(req,res)) return
            res.writeHead(200, { "content-type": "text/html" })
            res.end(index)
            break;
        case "/register":
            res.writeHead(200, { "content-type": "text/html" })
            res.end(register)
            break;
        case "/login":
            res.writeHead(200, { "content-type": "text/html" })
            res.end(loginPage)
            break;
        case "/auth.js":
            res.writeHead(200, { "content-type": "text/js" })
            res.end(auth)
            break;
        case "/style.css":
            res.writeHead(200, { "content-type": "text/css" })
            res.end(style)
            break;
        case "/script.js":
            res.writeHead(200, { "content-type": "text/js" })
            res.end(script)
            break;
        case "/api/register":
            let data = ""
            req.on("data", (chunk) => data += chunk)
            req.on("end", async () => {
                data = JSON.parse(data)
                console.log(data)
                let hash = await bcrypt.hash(data.password, 10)
                console.log(hash)
                console.log(await bcrypt.compare(data.password, hash))
                if (await db.checkExists(data.login)) {
                    res.end("User exist")
                    return
                }
                await db.addUser(data.login, hash)
                res.end(JSON.stringify({link: '/login'}))
            });
            break;
        case "/api/login":
            let data1 = ""
            req.on("data", (chunk) => data1 += chunk)
            req.on("end", async () => {
                let {login, password}=JSON.parse(data1)
                let info = await db.getUser(login)
                if(info.length==0){
                    res.end(JSON.stringify({status:"your datas isn't right"}))
                    return
                }
                if(await bcrypt.compare(password,info[0].password)){
                    let token = jwt.sign({login, id: info[0].id}, "Nikita", {expiresIn: "1h"})
                    res.end(JSON.stringify({status: "ok", token, login: info[0].login, id: info[0].id}))
                }else{
                    res.end(JSON.stringify({status:"your datas isn't right"}))
                }
            });
            break;
        default:
            res.writeHead(404, { "content-type": "text/html" })
            res.end("<h1>404 not found</h1>")
    }
}).listen(3000, () => console.log("server is on!"))

let io = new Server(ser)

io.on("connection", async function (s) {
    console.log(s.id)
    let message = await db.getMessages()
    message = message.map(m => ({ name: m.login, text: m.contex }))
    io.emit("update", JSON.stringify(message))
    s.on("message", async (data) => {
        // console.log(data)
        // messages.push(data) додавало в масив
        // io.emit("update", JSON.stringify(messages))
        data = JSON.parse(data)
        await db.addMessage(data.text, data.name)
        let message = await db.getMessages()
        message = message.map(m => ({ name: m.login, text: m.contex }))
        io.emit("update", JSON.stringify(message))

    })
})

function guarded(req,res){
    if(req.headers.cookie == undefined){
        res.writeHead(302, {"location": "/register"})
        res.end()
        return
    }
    let cookies = req.headers.cookie.split("; ")
    let token = cookies.find(el=>el.startsWith("token")).split("=")[1]
    let decoded = jwt.decode(token, "Nikita")
    if(!decoded){
        res.writeHead(302, {"location": "/register"})
        res.end()
        return
    }else{
        return decoded
    }
}

// db.getUsers().then(res=>console.log(res)).catch(err=>console.log(err))

// db.getMessages().then(res=>console.log(res)).catch(err=>console.log(err))

// db.addMessage("hello", 1).then(res=>console.log(res)).catch(err=>console.log(err))