fetch("http://localhost:3000/api/auth/forgot-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "amit.aryahsworld@gmail.com" })
}).then(res => res.json().then(data => ({status: res.status, data})))
  .then(console.log)
  .catch(console.error);
