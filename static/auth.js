let registerForm = document.querySelector(".register form")

registerForm.addEventListener("submit", (e) => {
    e.preventDefault()
    let data = new FormData(e.target)
    let login = data.get("login")
    let password = data.get("password")
    let passwordR = data.get("passwordR")
    if (password != passwordR) {
        alert("password is not the same")
        return;
    }
    if (password.length < 3 || login.length < 2) {
        alert("login or password is too short")
        return;
    }
    fetch("/api/register", {
        method: "post",
        body: JSON.stringify({ login, password })
    }).then((res) => {
    if(res.status =302) window.location("/login")
        return res.json
    }).then(res => {
        console.log(res)
    })
})